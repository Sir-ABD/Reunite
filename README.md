# 🧳 Reunite – FUD Lost & Found Management System

![MERN](https://img.shields.io/badge/Stack-MERN-green)
![Frontend](https://img.shields.io/badge/Frontend-React-blue)
![Backend](https://img.shields.io/badge/Backend-Node.js%20%26%20Express-lightgrey)
![Database](https://img.shields.io/badge/Database-MongoDB-brightgreen)
![License](https://img.shields.io/badge/License-Academic-orange)
![Status](https://img.shields.io/badge/Status-Active-success)

---

## 📖 Overview

**Reunite** is a full-stack MERN web application developed for the **Federal University Dutse (FUD)** community. It provides a **secure, centralized, and intelligent platform** for reporting, tracking, and recovering lost items.

It replaces informal systems (WhatsApp, word-of-mouth) with a **structured digital solution**, improving recovery rates and accountability.

---
## 📸 Screenshot
![Landing page](./Screenshot (221).png)
---
## 🧩 Features

- 🔐 Secure Authentication (JWT + Login System)  
- 📤 Report Lost Items  
- 📥 Report Found Items  
- 🔎 Advanced Search & Filtering  
- 🤖 Smart AI Matching System  
- 💬 Real-Time Chat  
- 📍 Location-Based Reporting  
- 🔔 Notifications  
- 🛡️ Ownership Verification  
- 📊 Admin Dashboard  

---

## 🧠 System Workflow
```text
User Login → Report Item → AI Matching → Submit Claim → Verify Ownership → Item Returned
```

---

## 🏗️ System Architecture

- **Frontend:** React.js (Vite) + Tailwind CSS  
- **Backend:** Node.js + Express.js  
- **Database:** MongoDB Atlas  
- **Storage:** Cloudinary  

---

## ⚙️ Tech Stack

| Layer | Technology |
|------|-----------|
| Frontend | React.js, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas |
| Cloud | Cloudinary |
| Version Control | Git & GitHub |

---

## 🔄 Agile Development (Scrum)

| Sprint | Deliverables |
|--------|-------------|
| Sprint 1 | Authentication & Database Setup |
| Sprint 2 | Lost/Found Reporting & Search |
| Sprint 3 | AI Matching & Chat System |
| Sprint 4 | Testing & Optimization |

---

## 👥 Team & Roles

| Name | Role |
|------|------|
| Samuel Usihyel Ali | Product Owner |
| Abdulrazaq Isah | Scrum Master |
| Nnabuko Chinonso | Frontend Lead |
| Ekesili Mirabel | UI/UX Designer |
| Tumbert Amir | Backend (Lost Items) |
| Aliyu Haruna | Backend (Chat) |
| Yekini Emmanuel | Backend (Found Items) |
| Usman Aliyu | DevOps |
| Aliyu Abdurrahman | Frontend (Search UI) |
| Otuegbe Williams | Backend (Admin) |

---

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/reunite.git
cd reunite
```
### 2. Backend Setup
```bash
cd backend
npm install
npm run dev
```
### 3. Environment Setup

Create a `.env` file in the `/backend` directory:

```env
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret
CLOUDINARY_NAME=your_name
CLOUDINARY_KEY=your_key
CLOUDINARY_SECRET=your_secret
```
### 4. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
## 🧪 Testing
* **Authentication Validation:** Verified secure login, Google OAuth 2.0 flow, and JWT session persistence.
* **Item Posting:** Validated multipart-form data handling and image uploads via Cloudinary.
* **Search Functionality:** Tested real-time filtering and keyword matching for item discovery.
* **Match Notifications:** Confirmed instant toast alerts and automated matching logic.

---

## 📊 Impact
* 📈 **Improved Recovery Rate:** Drastically reduces the time between losing an item and its recovery.
* 🔒 **Enhanced Security:** Implemented a digital "Chain of Custody" via the Keepers Ledger for full accountability.
* 🏫 **Centralized Solution:** Replaces fragmented social media groups with a single, official FUD portal.
* 🤝 **Student Collaboration:** Fosters a community-driven environment based on trust and mutual assistance.

---

## ⚠️ Challenges
* **Team Coordination:** Synchronizing backend and frontend workflows across a distributed team.
* **Time Management:** Balancing rapid development cycles with academic requirements.
* **Agile Curve:** Transitioning from traditional methods to a fast-paced **Scrum** framework.

---

## 🔮 Future Improvements
* 📱 **Mobile Ecosystem:** Expanding the SPA into native Android and iOS applications.
* 🤖 **Computer Vision:** Implementing Gemini-powered image recognition for automated item verification.
* 📡 **GPS Geolocation:** Tagging precise campus coordinates for "Found" locations.
* 🔔 **Push Notifications:** Moving beyond toast alerts to system-level mobile notifications.

---

## 📜 License
This project is developed strictly for academic purposes as part of the **FUD CSC323 Agile Development Team Project** course.

---

## 🙌 Acknowledgment
A special thank you to:
* **Dr. Zaharadden Lawal:** For guidance and technical oversight.
* **Our Agile Team:** For the collective effort in building a secure campus ecosystem.
* **Federal University Dutse:** For providing the environment to innovate.

---

## ⭐ Support
If you find this project valuable for the FUD community, give it a star!
