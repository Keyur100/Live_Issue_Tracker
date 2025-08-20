const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
    cors:{origin: '*'} 
});

app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/tracker', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('MongoDB connection error:', err);
})

// issue schema

const issueSchema = new mongoose.Schema({
    title: String,
    description: String,
    status: { type: String, default: 'open' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Issue = mongoose.model('Issue', issueSchema);
// get all issues with filter
app.get('/issues', async (req, res) => {
    try {
        const {status} = req.query;
        const filter = status ? { status:status } : {};
        const issues = await Issue.find(filter).sort({ createdAt: -1 })
        res.json(issues);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// create issue
app.post('/issues', async (req, res) => {
    try{
        
const newIssue = await Issue.create(req.body);
        io.emit('newIssue', newIssue);// notify all clients about the new issue
        res.status(201).json(newIssue);
    }catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.put('/issues/:id/resolved', async (req, res) => {
    try {
        const { id } = req.params;
        const updatedIssue = await Issue.findByIdAndUpdate(id, {status:"resolved"}, { new: true });
        if (!updatedIssue) {
            return res.status(404).json({ message: 'Issue not found' });
        }
        io.emit('updateIssue', updatedIssue); // notify all clients about the updated issue
        res.json(updatedIssue);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


io.on('connection', (socket) => {
    console.log('A user online',socket.id);
    
    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

server.listen(3000, () => {
    console.log('Server is running on port 3000');
});