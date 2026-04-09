# 🏥 Jeevan – AI-Powered Health Companion

## 📌 Overview

Jeevan is a multilingual AI-driven healthcare platform designed to guide users from **awareness to action**. It combines an intelligent chatbot, structured education, and a complete care ecosystem with role-based portals.

---

## 🚀 Core Features

### 🤖 AI Chatbot

* Multilingual support (English, Hindi, Kannada)
* Context-aware health guidance
* Fallback system for reliability (no crashes)
* Integrated video recommendations inside chat

---

### 🎥 Smart Video Recommendations

* Keyword-based intent detection (PCOS, periods, hygiene, etc.)
* Returns 2–3 relevant YouTube videos
* In-app playback using embedded player (no external redirects)

---

### 📚 Education Module

* Card-based learning (Periods, PCOS, Hygiene, Mental Health)
* Detailed structured pages:

  * Key points
  * Warning signs
  * Tips & solutions
* Multilingual content support
* Integrated “Ask Jeevan” chatbot trigger

---

### 🛒 Care Network

* Doctor consultation booking
* Product marketplace
* Sponsored help system
* Fully integrated with chatbot and education flow

---

## 🧑‍💻 Role-Based System

### 👤 User Portal

* Access chatbot, education, and care services
* Book appointments and request support

### ⚕️ Doctor Portal

* View appointments from users
* Confirm appointments
* Real-time status updates

### 🤝 Sponsor Portal

* View support requests
* Approve or reject requests
* Manage aid distribution

---

## 🔐 Authentication

* Role-based login system:

  * User
  * Doctor
  * Sponsor
* Session stored using localStorage
* Route protection based on roles

---

## 🗄️ Database Design (SQLite)

### Tables:

**Users**

* id, name, email, password, role

**Appointments**

* id, user_name, doctor_name, date, time, status

**SupportRequests**

* id, issue, description, type, status

---

## ⚙️ Backend Implementation

* Built using FastAPI

* REST API endpoints:

  * POST /login
  * POST /appointments
  * GET /appointments
  * PATCH /appointments/{id}
  * POST /support-requests
  * GET /support-requests
  * PATCH /support-requests/{id}

* Password hashing (SHA-256)

* UUID-based record IDs

* Error-handling with fallback responses

---

## 🎨 Frontend Implementation

* React + Tailwind CSS
* Monochrome (black & white) professional UI
* Responsive design (mobile-first)
* Component-based architecture

---

## 🔄 Data Flow

1. User logs in
2. Books doctor / requests support
3. Data stored in SQLite database
4. Doctor/Sponsor portals fetch real data
5. Status updated (Confirmed / Approved)

---

## 🧠 System Highlights

* End-to-end workflow (not just UI)
* Real-time data interaction across roles
* Reliable chatbot with fallback system
* Lightweight architecture (SQLite, minimal APIs)
* Clean, scalable design

---

## 🏁 Conclusion

Jeevan transforms healthcare from **information-only platforms** into a **complete actionable ecosystem**, connecting users, doctors, and sponsors in one unified system.
