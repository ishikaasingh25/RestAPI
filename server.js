// server.js
const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const db = require('./firebase');
const { authenticateToken } = require('./auth');
const bcrypt = require('bcrypt');

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const secretKey = "AIzaSyC7P-q_O1ccqBuZFVMbISkailqey6YTuSA";


const users = [];


function validatePostData(req, res, next) {
    const { title, content } = req.body;
    if (!title || !content) {
        return res.status(400).json({ message: 'Title and content are required' });
    }
    next();
}


app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = { id: users.length + 1, username, password: hashedPassword };
    users.push(user);
    res.status(201).json({ message: 'User registered successfully' });
});

// Login a user and generate a token
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    const user = users.find(u => u.username === username);
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, secretKey, { expiresIn: '1h' });
    res.status(200).json({ token });
});

// Create a new blog post
app.post('/posts', authenticateToken, validatePostData, async (req, res) => {
    try {
        const { title, content } = req.body;
        const newPost = { title, content, createdAt: new Date() };
        const docRef = await db.collection('posts').add(newPost);
        res.status(201).json({ id: docRef.id, ...newPost });
    } catch (error) {
        res.status(500).json({ message: 'Failed to create post', error });
    }
});

// Retrieve a list of all blog posts
app.get('/posts', authenticateToken, async (req, res) => {
    try {
        const snapshot = await db.collection('posts').get();
        const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve posts', error });
    }
});

// Retrieve a single blog post by its ID
app.get('/posts/:id', authenticateToken, async (req, res) => {
    try {
        const doc = await db.collection('posts').doc(req.params.id).get();
        if (!doc.exists) {
            return res.status(404).json({ message: 'Post not found' });
        }
        res.status(200).json({ id: doc.id, ...doc.data() });
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve post', error });
    }
});

// Update an existing blog post
app.put('/posts/:id', authenticateToken, validatePostData, async (req, res) => {
    try {
        const { title, content } = req.body;
        const updatedPost = { title, content, updatedAt: new Date() };
        const docRef = db.collection('posts').doc(req.params.id);
        await docRef.update(updatedPost);
        res.status(200).json({ id: docRef.id, ...updatedPost });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update post', error });
    }
});

// Delete a blog post
app.delete('/posts/:id', authenticateToken, async (req, res) => {
    try {
        await db.collection('posts').doc(req.params.id).delete();
        res.status(200).json({ message: 'Post deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete post', error });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
