# 🧳 Reunite - FUD Lost & Found System

Reunite is a full-stack MERN application designed specifically for the Federal University Dutse (FUD) community. It provides a secure, centralized platform for students and staff to report lost items, catalog found property, and communicate safely to facilitate the return of belongings.

---

## 👥 Project Team & Role Distribution

| S/N | Reg No | Name | Role & Module Ownership |
| :-- | :--- | :--- | :--- |
| 1 | FCP/CSC/23/1100 | SAMUEL Usihyel Ali | **Product Owner** – Backlog & Stakeholders |
| 2 | FCP/CSC/23/1023 | Abdulrazaq Isah | **Scrum Master** – Tech Architecture & Coordination |
| 3 | FCP/CSC/23/1036 | NNABUKO Chinonso G. | **Frontend Lead** – UI & Testing Lead |
| 4 | FCP/CSC/23/1033 | EKESILI Nmesomachukwu M. | **UI/UX Designer** – User Flow & Wireframes |
| 5 | FCP/CSC/23/1049 | TUMBERT Amir Jafar | **Backend Dev** – Lost Item Module |
| 6 | FCP/CSC/23/1034 | ALIYU Haruna | **Backend Dev** – Chat & Notifications |
| 7 | FCP/CSC/23/2001 | YEKINI Emmanuel O. | **Backend Dev** – Found Item Module |
| 8 | FCP/CSC/23/1072 | Usman Aliyu Muhammad | **DevOps Engineer** – Deployment & Git Mgmt |
| 9 | FCP/CSC/23/1042 | ALIYU Abdurrahman | **Frontend Dev** – Search & Filter Interface |
| 10 | FCP/CSC/23/1092 | OTUEGBE Chukwuemeka W. | **Backend Dev** – Admin & Database Mgmt |

---

## 🚀 Technical Stack

- **Frontend:** React.js (Vite) & Tailwind CSS
- **Backend:** Node.js & Express.js
- **Database:** MongoDB Atlas
- **Storage:** Cloudinary (Image Uploads)
- **Workflow:** CPU-Optimized Local Development

---

## 🛠️ Getting Started

### 1. Environment Configuration
Create a `.env` file in the `/backend` directory based on the `Sample.env` provided. Ensure your MongoDB Atlas URI and Cloudinary credentials are correct.

### 2. Backend Setup
```bash
cd backend
npm install
npm run dev