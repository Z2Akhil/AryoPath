import express from 'express';

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.json({ 'message': 'app is running fine.' });
});

app.listen(port, () => {
    console.log(`backend is listening to port ${port}`)
})