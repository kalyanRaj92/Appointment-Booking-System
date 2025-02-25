# Appointment Booking System

## Overview

This project is an Appointment Booking System that allows users to book appointments with doctors. The backend is built using Node.js and Express, with MongoDB as the database for storing appointment and doctor information.

## Features

- Create, read, update, and delete appointments.
- Check availability of appointment slots based on doctor working hours.
- Validate appointment times against working hours.
- Handle overlapping appointments.

## Assumptions and Design Decisions

- **Time Zones**: The application assumes that all times are provided in UTC. Working hours for doctors are stored in "HH:mm" format.
- **Data Validation**: Input validation is performed to ensure that all required fields are provided and that the duration of appointments is a positive number.
- **Error Handling**: The application includes error handling for common scenarios, such as invalid input and unavailable time slots.
- **Modular Code Structure**: The code is organized into separate modules for routes, models, and controllers to enhance maintainability and readability.

## Installation Instructions

To set up the project locally, follow these steps:

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/kalyanRaj92/Appointment-Booking-System.git
   cd server
   ```
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Set Up Environment Variables**:
   ```bash
   MONGODB_URI=your_mongodb_connection_string
   PORT=5000
   ```
4. **Run the Application**:
   ```bash
   npm run dev
   ```
5. Run the application: `http://localhost:5000.`