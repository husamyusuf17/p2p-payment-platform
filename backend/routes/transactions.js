const express = require("express");
const pool = require("../config/database");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// All transaction routes require authentication
router.use(authMiddleware);

// POST /api/transactions/send - Send money to another user (ATOMIC!)
router.post("/send", async (req, res) => {
  const client = await pool.connect();

  try {
    const { receiver_email, amount, description } = req.body;
    const sender_id = req.userId;

    // Validation: Required fields
    if (!receiver_email || !amount) {
      return res.status(400).json({
        error: "Receiver email and amount are required",
      });
    }

    // Validation: Amount must be positive
    const transferAmount = parseFloat(amount);
    if (transferAmount <= 0) {
      return res.status(400).json({
        error: "Amount must be greater than 0",
      });
    }

    // Validation: Decimal places
    if (!/^\d+(\.\d{1,2})?$/.test(amount.toString())) {
      return res.status(400).json({
        error: "Amount must have maximum 2 decimal places",
      });
    }

    // Find receiver by email
    const receiverResult = await client.query(
      "SELECT id, email, full_name FROM users WHERE email = $1",
      [receiver_email.toLowerCase()],
    );

    if (receiverResult.rows.length === 0) {
      return res.status(404).json({
        error: "Receiver not found",
        receiver_email: receiver_email,
      });
    }

    const receiver = receiverResult.rows[0];
    const receiver_id = receiver.id;

    // Validation: Can't send to yourself
    if (sender_id === receiver_id) {
      return res.status(400).json({
        error: "Cannot send money to yourself",
      });
    }

    // START DATABASE TRANSACTION (THE CRITICAL PART!)
    await client.query("BEGIN");

    // Lock sender's row and check balance (prevent race conditions)
    const senderResult = await client.query(
      "SELECT wallet_balance FROM users WHERE id = $1 FOR UPDATE",
      [sender_id],
    );

    const senderBalance = parseFloat(senderResult.rows[0].wallet_balance);

    // Check sufficient balance
    if (senderBalance < transferAmount) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        error: "Insufficient balance",
        current_balance: senderBalance,
        requested_amount: transferAmount,
      });
    }

    // Subtract from sender
    await client.query(
      "UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2",
      [transferAmount, sender_id],
    );

    // Add to receiver
    await client.query(
      "UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2",
      [transferAmount, receiver_id],
    );

    // Record transaction
    const transactionResult = await client.query(
      "INSERT INTO transactions (sender_id, receiver_id, amount, description, transaction_type) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [
        sender_id,
        receiver_id,
        transferAmount,
        description || `Transfer to ${receiver.full_name}`,
        "transfer",
      ],
    );

    // Get updated balances
    const updatedSenderResult = await client.query(
      "SELECT wallet_balance FROM users WHERE id = $1",
      [sender_id],
    );

    // COMMIT - Make all changes permanent!
    await client.query("COMMIT");

    res.json({
      message: "Transfer successful",
      transaction: transactionResult.rows[0],
      your_new_balance: updatedSenderResult.rows[0].wallet_balance,
      sent_to: {
        email: receiver.email,
        name: receiver.full_name,
      },
    });
  } catch (error) {
    // If ANYTHING fails, rollback everything!
    await client.query("ROLLBACK");
    console.error("Send money error:", error);
    res.status(500).json({
      error: "Transfer failed",
      details: error.message,
    });
  } finally {
    // Always release the database connection
    client.release();
  }
});

module.exports = router;

// GET /api/transactions - Get transaction history
router.get("/", async (req, res) => {
  try {
    const userId = req.userId;

    // Get all transactions where user is sender OR receiver
    const result = await pool.query(
      `SELECT 
        t.*,
        sender.email as sender_email,
        sender.full_name as sender_name,
        receiver.email as receiver_email,
        receiver.full_name as receiver_name
      FROM transactions t
      JOIN users sender ON t.sender_id = sender.id
      JOIN users receiver ON t.receiver_id = receiver.id
      WHERE t.sender_id = $1 OR t.receiver_id = $1
      ORDER BY t.created_at DESC`,
      [userId],
    );

    // Add a flag to indicate if transaction was sent or received
    const transactions = result.rows.map((transaction) => {
      const isSent = transaction.sender_id === userId;

      return {
        id: transaction.id,
        amount: transaction.amount,
        description: transaction.description,
        transaction_type: transaction.transaction_type,
        status: transaction.status,
        created_at: transaction.created_at,
        direction: isSent ? "sent" : "received",
        other_party: isSent
          ? {
              email: transaction.receiver_email,
              name: transaction.receiver_name,
            }
          : {
              email: transaction.sender_email,
              name: transaction.sender_name,
            },
      };
    });

    res.json({
      transactions: transactions,
      total_count: transactions.length,
    });
  } catch (error) {
    console.error("Get transactions error:", error);
    res.status(500).json({
      error: "Failed to get transactions",
      details: error.message,
    });
  }
});

// GET /api/users/search?email=ahmed - Search for users by email
router.get("/users/search", async (req, res) => {
  try {
    const { email } = req.query;
    const userId = req.userId;

    if (!email) {
      return res.status(400).json({
        error: "Email query parameter is required",
      });
    }

    // Search for users by email (case insensitive, partial match)
    const result = await pool.query(
      "SELECT id, email, full_name FROM users WHERE LOWER(email) LIKE LOWER($1) AND id != $2 LIMIT 10",
      [`%${email}%`, userId],
    );

    res.json({
      users: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("Search users error:", error);
    res.status(500).json({
      error: "Search failed",
      details: error.message,
    });
  }
});
