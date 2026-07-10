const Message = require("../models/Message");

const sendMessage = async (req, res) => {
  try {
    const { sender, receiver, text } = req.body;

    const message = await Message.create({
      sender,
      receiver,
      text,
    });

    res.json({
      success: true,
      message,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
    });
  }
};

const getMessages = async (req, res) => {
  try {
    const { sender, receiver } = req.params;

    const messages = await Message.find({
      $or: [
        { sender, receiver },
        { sender: receiver, receiver: sender },
      ],
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
    });
  }
};

module.exports = {
  sendMessage,
  getMessages,
};