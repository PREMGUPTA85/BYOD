// backend/scripts/seed.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const User = require('../models/User');
const Task = require('../models/Task');
const Restriction = require('../models/Restriction');

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany();
    await Task.deleteMany();
    await Restriction.deleteMany();
    console.log('🧹 Cleared existing data');

    // Create teacher
    const salt = await bcrypt.genSalt(10);
    const teacherPassword = await bcrypt.hash('teacher123', salt);
    const teacher = await User.create({
      name: 'Dr. John Doe',
      email: 'teacher@school.edu',
      password: teacherPassword,
      role: 'teacher'
    });

    // Create students
    const studentPassword = await bcrypt.hash('student123', salt);
    const student1 = await User.create({
      name: 'Alice Smith',
      email: 'alice@school.edu',
      password: studentPassword,
      role: 'student'
    });
    
    const student2 = await User.create({
      name: 'Bob Jones',
      email: 'bob@school.edu',
      password: studentPassword,
      role: 'student'
    });

    console.log('👤 Created dummy users (teacher@school.edu, alice@school.edu, bob@school.edu)');

    // Create initial tasks
    await Task.create([
      {
        title: 'Complete Chapter 5 Exercise',
        description: 'Read pages 100-115 and solve the math problems.',
        dueDate: new Date(Date.now() + 86400000 * 2), // 2 days from now
        assignedBy: teacher._id
      },
      {
        title: 'Science Project Draft',
        description: 'Submit your initial hypothesis and material list.',
        dueDate: new Date(Date.now() + 86400000 * 5),
        assignedBy: teacher._id
      }
    ]);
    console.log('📋 Created dummy tasks');

    // Create web restrictions
    await Restriction.create([
      { url: 'facebook.com', addedBy: teacher._id },
      { url: 'netflix.com', addedBy: teacher._id },
      { url: 'tiktok.com', addedBy: teacher._id }
    ]);
    console.log('🚫 Created dummy web restrictions');

    console.log('🎉 Database seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding database:', err);
    process.exit(1);
  }
};

seedDB();
