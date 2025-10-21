# Mytro - Social Media App

Welcome to **Mytro**, a modern social media platform built with Django. Mytro enables users to connect, share, and interact through posts, stories, comments, and profiles — all wrapped in a sleek, responsive interface.

Developed by **Abhimanyu Vaishnav**  
📧 abhimanyuvaishnav2017@gmail.com

---

## 🚀 Features

- 📝 Create, edit, and delete posts with image support
- 💬 Real-time commenting and enhanced comment threads
- 📷 Story creation and media sharing
- 👤 Profile customization with modern UI
- 🔍 Hashtag-based post discovery
- 🧠 AI-enhanced suggestions and follow recommendations
- 🛠️ Admin panel for user and content management
- 🌙 Dark mode and responsive design

---

## 🧰 Tech Stack

- **Backend**: Django, Channels (WebSockets)
- **Frontend**: HTML, CSS, JavaScript
- **Database**: SQLite (default), easily swappable
- **Real-time**: Django Channels for live updates
- **Templating**: Django Templates with custom tags
---

## 🛠️ Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/mytro.git
   cd mytro
Create and activate a virtual environment

bash
python -m venv mytroenv
source mytroenv/bin/activate  # On Windows: mytroenv\Scripts\activate
Install dependencies

bash
pip install -r requirements.txt
Apply migrations

bash
python manage.py migrate
Run the development server

bash
python manage.py runserver
Access the app Open your browser and go to http://127.0.0.1:8000/

🧪 Running Tests
bash
python manage.py test
Includes:

AJAX post tests

Template rendering tests

Signal and model behavior tests

📌 Notes
Profile pictures and post images are stored in /media

Static files are organized by components and utilities

Admin panel available at /admin (requires superuser)

📬 Contact
For questions, suggestions, or collaboration: 
Abhimanyu Vaishnav 
📧 abhimanyuvaishnav2017@gmail.com
# Mytro
Welcome to **Mytro**, a modern social media platform built with Django. Mytro enables users to connect, share, and interact through posts, stories, comments, and profiles — all wrapped in a sleek, responsive interface.
