const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: function() {
        
        // Sinon (si messageType n'est pas 'text' OU s'il y a un fileUrl), content n'est pas requis.
        return this.messageType === 'text' && !this.fileUrl;
      },
    },
    messageType: {
      type: String,
      enum: ["text", "image", "file"],
      default: "text",
      required: true, // messageType devrait toujours être défini
    },
    fileUrl: {
      type: String,
      // FIX: Rendre 'fileUrl' conditionnellement obligatoire si le message n'est PAS de type 'text'
      required: function() {
        return this.messageType !== 'text';
      },
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
