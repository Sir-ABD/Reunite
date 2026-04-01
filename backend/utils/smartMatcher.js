const Item = require('../models/item.model');
const Notification = require('../models/notification.model');
const User = require('../models/user.model');
const sendEmail = require('./sendEmail');

// We remove the top-level require for transformers and handle it inside the function
let extractorPromise = null;

/**
 * Singleton getter for the local transformer pipeline.
 * Ensures we only ever initialize it once, even if called concurrently.
 */
const getExtractor = async () => {
  if (extractorPromise) return extractorPromise;

  extractorPromise = (async () => {
    try {
      // DYNAMIC IMPORT FIX
      const { pipeline, env } = await import('@xenova/transformers');
      
      // Set cache for Linux/WSL environment
      env.cacheDir = './.cache';
      env.allowLocalModels = true;

      console.log('----------------------------------------------------');
      console.log('[AI] 📦 INITIALIZING LOCAL TRANSFORMER MODEL...');
      const ext = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      console.log('[AI] ✅ Model Loaded Successfully!');
      return ext;
    } catch (err) {
      console.error('[AI] ❌ Failed to load transformer model:', err.message);
      extractorPromise = null; // Reset on failure so we can try again
      return null;
    }
  })();

  return extractorPromise;
};

/**
 * Generate 384-dimension embedding LOCALLY using CPU
 */
const generateEmbedding = async (text) => {
  try {
    if (!text || text.trim().length === 0) return null;

    // Timeout wrapper to prevent hanging indefinitely
    const extractor = await Promise.race([
      getExtractor(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Transformer initialization timed out after 30s")), 30000))
    ]);

    if (!extractor) {
      console.error("[AI] Local Embedding Error: Extractor is null");
      return null;
    }

    const output = await extractor(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data); 
  } catch (error) {
    console.error("[AI] Local Embedding Error:", error.message);
    return null;
  }
};

/**
 * Cosine Similarity Math (Remains the same)
 */
const calculateCosineSimilarity = (e1, e2) => {
  if (!e1 || !e2 || e1.length !== e2.length) return 0;
  let dot = 0, mag1 = 0, mag2 = 0;
  for (let i = 0; i < e1.length; i++) {
    dot += e1[i] * e2[i];
    mag1 += e1[i] * e1[i];
    mag2 += e2[i] * e2[i];
  }
  return dot / (Math.sqrt(mag1) * Math.sqrt(mag2)) || 0;
};

/**
 * Main Smart Matcher Function
 */
const smartMatcher = async (newItem, io) => {
  try {
    if (!newItem._id || !['Lost', 'Found'].includes(newItem.status)) return;

    const itemText = `${newItem.title}: ${newItem.description}`;
    const newItemEmbedding = await generateEmbedding(itemText);
    
    if (!newItemEmbedding) return;

    await Item.findByIdAndUpdate(newItem._id, { embedding: newItemEmbedding });

    const oppositeStatus = newItem.status === 'Lost' ? 'Found' : 'Lost';

    let candidates = [];
    try {
      candidates = await Item.aggregate([
        {
          $vectorSearch: {
            index: "vector_index", 
            path: "embedding", 
            queryVector: newItemEmbedding,
            numCandidates: 20, 
            limit: 5 
          }
        },
        {
          $match: {
            _id: { $ne: newItem._id },
            status: oppositeStatus,
            isActive: true
          }
        }
      ]);
    } catch (err) {
      console.warn('[SmartMatcher] Falling back to manual scan...');
      candidates = await Item.find({ 
        status: oppositeStatus, 
        isActive: true, 
        _id: { $ne: newItem._id } 
      }).lean();
    }

    for (const candidate of candidates) {
      if (!candidate.embedding || candidate.embedding.length !== 384) continue;
      const textSim = calculateCosineSimilarity(newItemEmbedding, candidate.embedding);
      
      // Threshold 0.82 is usually the "sweet spot" for this model
      if (textSim >= 0.82) {
        await createMatchNotifications(newItem, candidate, textSim, io);
      }
    }
  } catch (error) {
    console.error('[SmartMatcher] Execution Error:', error.message);
  }
};

/**
 * Helper: save in-app notification
 */
const saveNotification = async (userId, message, itemId, type, io) => {
  const notif = new Notification({ userId, message, itemId, type });
  await notif.save();
  if (io) io.to(userId.toString()).emit('newNotification', notif);
  return notif;
};

/**
 * Helper: send email safely (swallow errors so one failure doesn't break the rest)
 */
const trySendEmail = async (email, subject, template, data) => {
  if (!process.env.EMAIL_USER) return;
  try {
    await sendEmail(email, subject, template, data);
  } catch (err) {
    console.error(`[SmartMatcher] Email send failed to ${email}:`, err.message);
  }
};

/**
 * Build a deep link to a specific item on the frontend
 */
const buildItemLink = (itemId) => {
  const base = process.env.FRONTEND_URL || 'http://localhost:5173';
  return `${base}/items/${itemId}`;
};

/**
 * Professional Notification & Keeper Logic — notifies finder, owner, keeper
 */
const createMatchNotifications = async (newItem, candidate, matchScore, io) => {
  try {
    const isNewLost = newItem.status === 'Lost';
    const lostItem = isNewLost ? newItem : candidate;
    const foundItem = isNewLost ? candidate : newItem;

    const lostOwner = await User.findById(lostItem.postedBy);
    const finder = await User.findById(foundItem.postedBy);
    const keeper = foundItem.assignedKeeper
      ? await User.findById(foundItem.assignedKeeper)
      : null;

    if (!lostOwner || !finder) return;

    const percentage = Math.round(matchScore * 100);
    const lostItemLink = buildItemLink(lostItem._id);
    const foundItemLink = buildItemLink(foundItem._id);

    // ── Link both items together so return sync works ────────────────────────
    await Item.findByIdAndUpdate(lostItem._id, { matchedItemId: foundItem._id });
    await Item.findByIdAndUpdate(foundItem._id, { matchedItemId: lostItem._id });

    // ── 1. Notify the KEEPER (Action Required) ───────────────────────────────
    if (keeper) {
      const kMsg = `👮 Action Required: AI found a ${percentage}% match for "${foundItem.title}" you are keeping. Owner: ${lostOwner.name}. Click to review.`;
      await saveNotification(keeper._id, kMsg, foundItem._id, 'keeperAction', io);

      await trySendEmail(keeper.email, 'Smart Match Alert – Action Required | Reunite', 'matchFound', {
        name: keeper.name,
        itemTitle: foundItem.title,
        matchPercentage: percentage,
        viewLink: foundItemLink,
        actionText: 'Review Match on Dashboard',
        keeperName: keeper.name,
      });
    }

    // ── 2. Notify the OWNER (lost-item poster) ───────────────────────────────
    const oMsg = `🔍 AI Match (${percentage}%): Your lost "${lostItem.title}" may have been found! ${keeper ? `Managed by Keeper ${keeper.name}.` : 'Click to view the found item.'}`;
    await saveNotification(lostOwner._id, oMsg, foundItem._id, 'smartMatch', io);

    await trySendEmail(lostOwner.email, 'Your Lost Item May Have Been Found! | Reunite', 'matchFound', {
      name: lostOwner.name,
      itemTitle: lostItem.title,
      matchPercentage: percentage,
      viewLink: foundItemLink,
      actionText: `View Found Item (${percentage}% Match)`,
      keeperName: keeper ? keeper.name : null,
    });

    // ── 3. Notify the FINDER (found-item poster) ─────────────────────────────
    const fMsg = `✅ AI Match (${percentage}%): The item "${foundItem.title}" you found has a potential owner! ${keeper ? `The keeper ${keeper.name} has been notified.` : 'Click to view the lost item report.'}`;
    await saveNotification(finder._id, fMsg, lostItem._id, 'smartMatch', io);

    await trySendEmail(finder.email, 'Someone May Be Looking for the Item You Found! | Reunite', 'matchFound', {
      name: finder.name,
      itemTitle: foundItem.title,
      matchPercentage: percentage,
      viewLink: lostItemLink,
      actionText: `View Lost Item Report (${percentage}% Match)`,
      keeperName: keeper ? keeper.name : null,
    });

    console.log(`[SmartMatcher] ✅ Notifications sent to keeper, owner, and finder for ${percentage}% match.`);

  } catch (err) {
    console.error("Notification Error:", err.message);
  }
};

module.exports = { smartMatcher, generateEmbedding };