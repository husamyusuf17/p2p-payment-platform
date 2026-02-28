const express = require("express");
const pool = require("../config/database");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// All wallet routes require authentication
router.use(authMiddleware);

// GET /api/wallet/balance - Get current wallet balance
router.get("/balance", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT wallet_balance FROM users WHERE id = $1",
      [req.userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    res.json({
      balance: result.rows[0].wallet_balance,
    });
  } catch (error) {
    console.error("Get balance error:", error);
    res.status(500).json({
      error: "Failed to get balance",
      details: error.message,
    });
  }
});

// POST /api/wallet/deposit - Add money to wallet
router.post("/deposit", async (req, res) => {
  try {
    const { amount } = req.body;

    // Validation: Amount must be provided
    if (!amount) {
      return res.status(400).json({
        error: "Amount is required",
      });
    }

    // Validation: Amount must be positive
    const depositAmount = parseFloat(amount);
    if (depositAmount <= 0) {
      return res.status(400).json({
        error: "Amount must be greater than 0",
      });
    }

    // Validation: Amount must have max 2 decimal places
    if (!/^\d+(\.\d{1,2})?$/.test(amount.toString())) {
      return res.status(400).json({
        error: "Amount must have maximum 2 decimal places",
      });
    }

    // Update wallet balance
    const result = await pool.query(
      "UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2 RETURNING wallet_balance",
      [depositAmount, req.userId],
    );

    // Record transaction
    await pool.query(
      "INSERT INTO transactions (sender_id, receiver_id, amount, description, transaction_type) VALUES ($1, $2, $3, $4, $5)",
      [req.userId, req.userId, depositAmount, "Wallet deposit", "deposit"],
    );

    res.json({
      message: "Deposit successful",
      new_balance: result.rows[0].wallet_balance,
    });
  } catch (error) {
    console.error("Deposit error:", error);
    res.status(500).json({
      error: "Deposit failed",
      details: error.message,
    });
  }
});

// POST /api/wallet/withdraw - Remove money from wallet
router.post("/withdraw", async (req, res) => {
  try {
    const { amount } = req.body;

    // Validation: Amount must be provided
    if (!amount) {
      return res.status(400).json({
        error: "Amount is required",
      });
    }

    // Validation: Amount must be positive
    const withdrawAmount = parseFloat(amount);
    if (withdrawAmount <= 0) {
      return res.status(400).json({
        error: "Amount must be greater than 0",
      });
    }

    // Validation: Amount must have max 2 decimal places
    if (!/^\d+(\.\d{1,2})?$/.test(amount.toString())) {
      return res.status(400).json({
        error: "Amount must have maximum 2 decimal places",
      });
    }

    // Check sufficient balance
    const userResult = await pool.query(
      "SELECT wallet_balance FROM users WHERE id = $1",
      [req.userId],
    );

    const currentBalance = parseFloat(userResult.rows[0].wallet_balance);

    if (currentBalance < withdrawAmount) {
      return res.status(400).json({
        error: "Insufficient balance",
        current_balance: currentBalance,
        requested_amount: withdrawAmount,
      });
    }

    // Update wallet balance
    const result = await pool.query(
      "UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2 RETURNING wallet_balance",
      [withdrawAmount, req.userId],
    );

    // Record transaction
    await pool.query(
      "INSERT INTO transactions (sender_id, receiver_id, amount, description, transaction_type) VALUES ($1, $2, $3, $4, $5)",
      [
        req.userId,
        req.userId,
        withdrawAmount,
        "Wallet withdrawal",
        "withdrawal",
      ],
    );

    res.json({
      message: "Withdrawal successful",
      new_balance: result.rows[0].wallet_balance,
    });
  } catch (error) {
    console.error("Withdrawal error:", error);
    res.status(500).json({
      error: "Withdrawal failed",
      details: error.message,
    });
  }
});

module.exports = router;
