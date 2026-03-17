const Category = require('../models/category.model');
const SubCategory = require('../models/subCategory.model');

const seedCategories = async () => {
  try {
    const predefinedCategories = [
      { name: 'Electronics', description: 'Devices and gadgets', isPredefined: true },
      { name: 'Clothing', description: 'Apparel and accessories', isPredefined: true },
      { name: 'Books & Stationery', description: 'Textbooks, notebooks, and writing materials', isPredefined: true },
      { name: 'Personal Items', description: 'Wallets, keys, and other personal belongings', isPredefined: true },
      { name: 'Bags & Backpacks', description: 'All types of bags and their contents', isPredefined: true },
      { name: 'Documents & IDs', description: 'Student IDs, driver\'s licenses, and important papers', isPredefined: true },
      { name: 'Jewelry & Watches', description: 'Rings, necklaces, bracelets, and timepieces', isPredefined: true },
      { name: 'Sports & Fitness', description: 'Athletic gear, equipment, and apparel', isPredefined: true },
      { name: 'Miscellaneous', description: 'Items that don\'t fit into other categories', isPredefined: true },
    ];

    const predefinedSubCategories = {
      'Electronics': [
        { name: 'Laptops', description: 'Notebook computers' },
        { name: 'Smartphones', description: 'Mobile phones and tablets' },
        { name: 'Headphones', description: 'Audio devices (wired and wireless)' },
        { name: 'Chargers & Cables', description: 'Power adapters and data cables' },
        { name: 'USB Drives', description: 'Flash drives and external hard drives' },
        { name: 'Smartwatches', description: 'Wearable technology' },
      ],
      'Clothing': [
        { name: 'Jackets', description: 'Outerwear, hoodies, and sweatshirts' },
        { name: 'T-Shirts & Tops', description: 'Shirts and blouses' },
        { name: 'Pants', description: 'Jeans, trousers, and shorts' },
        { name: 'Hats & Gloves', description: 'Headwear and hand coverings' },
        { name: 'Shoes', description: 'Sneakers, boots, and sandals' },
      ],
      'Books & Stationery': [
        { name: 'Textbooks', description: 'Academic and course-related books' },
        { name: 'Notebooks', description: 'Spiral notebooks, journals, and planners' },
        { name: 'Pens & Pencils', description: 'Writing and drawing instruments' },
        { name: 'Calculators', description: 'Scientific and graphing calculators' },
      ],
      'Personal Items': [
        { name: 'Wallets', description: 'Wallets, coin purses, and card holders' },
        { name: 'Keys', description: 'Single keys or key rings' },
        { name: 'Glasses', description: 'Prescription eyeglasses and sunglasses' },
        { name: 'Water Bottles', description: 'Reusable bottles and thermoses' },
      ],
      'Bags & Backpacks': [
        { name: 'Backpacks', description: 'School backpacks' },
        { name: 'Purses', description: 'Handbags and clutches' },
        { name: 'Lunch Bags', description: 'Insulated lunch containers' },
      ],
      'Documents & IDs': [
        { name: 'Student IDs', description: 'University identification cards' },
        { name: 'Driver\'s Licenses', description: 'State-issued licenses or permits' },
        { name: 'Passports', description: 'International travel documents' },
        { name: 'Important Papers', description: 'Forms, letters, or certificates' },
      ],
      'Jewelry & Watches': [
        { name: 'Rings', description: 'Finger rings' },
        { name: 'Necklaces & Bracelets', description: 'Necklaces, chains, and wrist bracelets' },
        { name: 'Watches', description: 'Wristwatches (analog and digital)' },
      ],
      'Sports & Fitness': [
        { name: 'Water Bottles', description: 'Sports and fitness-related bottles' },
        { name: 'Gym Clothes', description: 'Workout shirts, shorts, and leggings' },
        { name: 'Equipment', description: 'Small gym equipment like jump ropes or resistance bands' },
      ],
      'Miscellaneous': [
        { name: 'Umbrellas', description: 'Rain umbrellas' },
        { name: 'Musical Instruments', description: 'Small instruments like harmonicas or flutes' },
        { name: 'Headphones', description: 'Gaming headphones or headsets' },
      ],
    };

    // 1. Seed Categories first
    const existingCategories = await Category.find({ name: { $in: predefinedCategories.map((c) => c.name) } });
    const existingNames = existingCategories.map((c) => c.name);

    const categoriesToInsert = predefinedCategories.filter((c) => !existingNames.includes(c.name));
    if (categoriesToInsert.length > 0) {
      await Category.insertMany(categoriesToInsert);
      console.log('New categories seeded successfully.');
    } else {
      console.log('No new categories to seed.');
    }

    const allCategories = await Category.find({});

    // 2. Seed SubCategories for each seeded/existing Category
    let subCategoriesToInsert = [];
    for (const category of allCategories) {
      const subCategoryList = predefinedSubCategories[category.name];
      if (subCategoryList) {
        const existingSubCategories = await SubCategory.find({ category: category._id });
        const existingSubCategoryNames = existingSubCategories.map(sc => sc.name);
        
        const newSubs = subCategoryList
          .filter(sub => !existingSubCategoryNames.includes(sub.name))
          .map(sub => ({
            ...sub,
            category: category._id, // Link to the parent category's ID
          }));
        
        subCategoriesToInsert = [...subCategoriesToInsert, ...newSubs];
      }
    }

    if (subCategoriesToInsert.length > 0) {
      await SubCategory.insertMany(subCategoriesToInsert);
      console.log('Subcategories seeded successfully.');
    } else {
      console.log('No new subcategories to seed.');
    }

  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

module.exports = seedCategories;