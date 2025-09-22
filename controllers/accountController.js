import { jsPDF } from "jspdf"; // Correct import for jsPDF in Node.js
import autoTable from "jspdf-autotable";
import Account from "../models/Account.js";
import Transaction from "../models/Transaction.js";
import Profile from "../models/Profile.js"; // Import the Profile model
import nodemailer from "nodemailer";

// Create a new account
export const createAccount = async (req, res) => {
  const { name, accountType, initialDeposit } = req.body;

  if (!name || !accountType) {
    return res
      .status(400)
      .json({ message: "Account name and type are required" });
  }

  try {
    // Create the account
    const account = await Account.create({
      userId: req.user.id,
      name,
      accountType,
      balance: initialDeposit || 0,
      accountNumber:
        "1" + Math.floor(100000000 + Math.random() * 900000000).toString(), // Generate unique account number
    });

    res.status(201).json(account);
  } catch (error) {
    console.error("Error creating account:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Fetch transactions for a specific account
export const getAccountTransactions = async (req, res) => {
  try {
    const accountId = req.params.accountId;

    // Fetch account details
    const account = await Account.findById(accountId);
    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    // Fetch transactions for the account
    const transactions = await Transaction.find({ accountId }).sort({
      date: -1,
    });

    res.status(200).json({
      accountName: account.name,
      accountNumber: account.accountNumber, // Include account number in the response
      balance: account.balance,
      transactions,
    });
  } catch (error) {
    console.error("Error fetching transactions:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all accounts for a user
export const getAccounts = async (req, res) => {
  try {
    const accounts = await Account.find({ userId: req.user.id });
    if (!accounts) {
      return res
        .status(404)
        .json({ message: "No accounts found for this user." });
    }
    res.status(200).json(accounts);
  } catch (error) {
    console.error("Error fetching accounts:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteAccount = async (req, res, next) => {
  try {
    const account = await Account.findById(req.params.accountId);

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    // Prevent deletion of the Main Savings account
    if (account.isPrimary) {
      return res
        .status(400)
        .json({ message: "The Main Savings Account cannot be deleted." });
    }

    await account.remove();
    res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export const generateStatementPDF = async (req, res) => {
  try {
    // Define Color Palette
    const COLOR_PRIMARY_ACCENT_MINT = "#A8E6CF"; // Not used directly in this version, but defined
    const COLOR_SECONDARY_ACCENT_TEAL = "#2D7A8A";
    const COLOR_TERTIARY_ACCENT_PEACH = "#FFD3B6"; // Not used directly in this version, but defined
    const COLOR_TEXT_DARK_CHARCOAL = "#333333";
    const COLOR_TEXT_MEDIUM_GREY = "#666666";
    const COLOR_WHITE = "#FFFFFF"; // jsPDF default background

    const accountId = req.params.accountId;

    // Fetch account, user and profile
    const account = await Account.findById(accountId).populate("userId");
    if (!account) {
      console.error(`Account not found for ID: ${accountId}`);
      return res.status(404).json({ message: "Account not found" });
    }

    const profile = await Profile.findOne({ userId: account.userId._id });
    if (!profile) {
      console.error(`Profile not found for user ID: ${account.userId._id}`);
      return res.status(404).json({ message: "Profile not found" });
    }

    const transactions = await Transaction.find({ accountId }).sort({
      date: -1,
    });
    if (!transactions.length) {
      console.error(`No transactions found for account ID: ${accountId}`);
      // Consider if you want to send an empty statement or an error
    }

    const doc = new jsPDF();
    doc.setFont("helvetica"); // Set default font

    // Add Bank Header
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(COLOR_SECONDARY_ACCENT_TEAL); // Deep Teal
    doc.text("YourBank", 105, 15, { align: "center" });
    doc.setFontSize(10); // Smaller size for address
    doc.setFont("helvetica", "normal");
    doc.setTextColor(COLOR_TEXT_MEDIUM_GREY); // Medium Grey
    doc.text("123 Bank Street, Financial City, 10001", 105, 22, {
      align: "center",
    });
    doc.text("Phone: +1 234 567 890 | Email: support@yourbank.com", 105, 28, {
      align: "center",
    });

    // Reset text color for subsequent sections
    doc.setTextColor(COLOR_TEXT_DARK_CHARCOAL); // Dark Charcoal

    // Add Client Information
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(COLOR_SECONDARY_ACCENT_TEAL); // Deep Teal
    doc.text("Client Information", 10, 40);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(COLOR_TEXT_DARK_CHARCOAL); // Dark Charcoal
    doc.text(`Name: ${account.userId.name}`, 10, 48);
    doc.text(`Address: ${profile.address || "N/A"}`, 10, 54); // Use address from the profile

    // Add Account Information
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(COLOR_SECONDARY_ACCENT_TEAL); // Deep Teal
    doc.text("Account Information", 10, 66);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(COLOR_TEXT_DARK_CHARCOAL); // Dark Charcoal
    doc.text(`Account Name: ${account.name}`, 10, 74);
    doc.text(`Account Number: ${account.accountNumber}`, 10, 80);
    doc.text(`Balance: R ${account.balance.toFixed(2)}`, 10, 86); // Ensure balance is formatted

    // Add Transactions Table Header
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(COLOR_SECONDARY_ACCENT_TEAL); // Deep Teal
    doc.text("Transaction History", 10, 98);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(COLOR_TEXT_DARK_CHARCOAL); // Dark Charcoal for table headers
    // Optional: Add a light background fill for the header row
    // doc.setFillColor(247, 249, 250); // Light Grey #F7F9FA
    // doc.rect(10, 100, 190, 8, 'F'); // Draw background rectangle
    doc.text("Date", 10, 106);
    doc.text("Reference", 60, 106);
    doc.text("Amount (R)", 190, 106, { align: "right" }); // Align amount right

    // Add Transactions Table Rows
    doc.setFont("helvetica", "normal");
    doc.setTextColor(COLOR_TEXT_DARK_CHARCOAL); // Dark Charcoal for table data
    let y = 114;
    transactions.forEach((transaction, index) => {
      // Optional: Alternate row background color
      // if (index % 2 === 0) {
      //   doc.setFillColor(255, 255, 255); // White
      // } else {
      //   doc.setFillColor(247, 249, 250); // Light Grey #F7F9FA
      // }
      // doc.rect(10, y - 5, 190, 8, 'F'); // Draw background rectangle for row

      doc.text(new Date(transaction.date).toLocaleDateString(), 10, y);
      doc.text(transaction.reference || "N/A", 60, y, { maxWidth: 100 }); // Add max width for long refs
      doc.text(transaction.amount.toFixed(2), 190, y, { align: "right" }); // Align amount right
      y += 8;
      if (y > 280) {
        // Check for page break
        doc.addPage();
        y = 20; // Reset y position for new page
        // Optional: Redraw headers on new page
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(COLOR_TEXT_DARK_CHARCOAL);
        doc.text("Date", 10, y);
        doc.text("Reference", 60, y);
        doc.text("Amount (R)", 190, y, { align: "right" });
        y += 8;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(COLOR_TEXT_DARK_CHARCOAL);
      }
    });

    // Determine period text
    const periodFrom = fromQuery
      ? fmtDate(fromQuery)
      : txAsc[0]
      ? fmtDate(txAsc[0].date)
      : fmtDate(new Date());
    const periodTo = toQuery
      ? fmtDate(toQuery)
      : txAsc[txAsc.length - 1]
      ? fmtDate(txAsc[txAsc.length - 1].date)
      : fmtDate(new Date());

    // Brand palette (aligned with UI)
    const brand = {
      teal: [15, 118, 110], // #0f766e
      lightTeal: [20, 184, 166], // #14b8a6
      slate: [71, 85, 105], // #475569
      gray: [100, 116, 139], // #64748b
      light: [241, 245, 249], // #f1f5f9
      rose: [225, 29, 72], // #e11d48
      emerald: [16, 185, 129], // #10b981
    };

    // Header / Footer renderer
    const drawHeader = (docInstance) => {
      // Top band
      docInstance.setFillColor(...brand.teal);
      docInstance.rect(0, 0, pageWidth, 72, "F");

      // Logo badge
      const logoX = margin;
      const logoY = 20;
      const logoSize = 36;
      docInstance.setFillColor(255, 255, 255);
      docInstance.circle(
        logoX + logoSize / 2,
        logoY + logoSize / 2,
        logoSize / 2,
        "F"
      );
      docInstance.setTextColor(...brand.teal);
      docInstance.setFont("helvetica", "bold");
      docInstance.setFontSize(14);
      docInstance.text("YB", logoX + logoSize / 2, logoY + logoSize / 2 + 5, {
        align: "center",
        baseline: "middle",
      });

      // Title
      docInstance.setTextColor(255, 255, 255);
      docInstance.setFont("helvetica", "bold");
      docInstance.setFontSize(18);
      docInstance.text("YourBank Account Statement", pageWidth / 2, 32, {
        align: "center",
      });
      docInstance.setFont("helvetica", "normal");
      docInstance.setFontSize(11);
      docInstance.text(
        "123 Bank Street, Financial City, 10001  •  +27 21 555 5555  •  support@yourbank.com",
        pageWidth / 2,
        50,
        { align: "center" }
      );
    };

    const drawFooter = (docInstance, pageNum, totalPages) => {
      const y = pageHeight - 30;
      docInstance.setDrawColor(230);
      docInstance.line(margin, y - 14, pageWidth - margin, y - 14);
      docInstance.setFont("helvetica", "normal");
      docInstance.setFontSize(10);
      docInstance.setTextColor(...brand.gray);
      docInstance.text(
        `Generated: ${new Date().toLocaleString("en-ZA")}`,
        margin,
        y
      );
      docInstance.text(
        `Page ${pageNum} of ${totalPages}`,
        pageWidth - margin,
        y,
        { align: "right" }
      );
    };

    // First page header
    drawHeader(doc);

    // Client & Account summary cards
    let yCursor = 92;

    // Client Card
    doc.setFillColor(...brand.light);
    doc.roundedRect(
      margin,
      yCursor,
      (pageWidth - margin * 2 - 12) / 2,
      94,
      8,
      8,
      "F"
    );
    doc.setTextColor(...brand.slate);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Client Information", margin + 12, yCursor + 18);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const clientLines = [
      `Name: ${account.userId.name || "—"}`,
      `Email: ${account.userId.email || "—"}`,
      `Address: ${profile.address || "—"}`,
    ];
    clientLines.forEach((t, i) =>
      doc.text(t, margin + 12, yCursor + 40 + i * 16)
    );

    // Account Card
    const rightX = margin + (pageWidth - margin * 2 - 12) / 2 + 12;
    doc.roundedRect(
      rightX,
      yCursor,
      (pageWidth - margin * 2 - 12) / 2,
      94,
      8,
      8,
      "F"
    );
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Account Information", rightX + 12, yCursor + 18);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const accLines = [
      `Account Name: ${account.name || "—"}`,
      `Account Number: ${mask(account.accountNumber)}`,
      `Period: ${periodFrom} — ${periodTo}`,
    ];
    accLines.forEach((t, i) => doc.text(t, rightX + 12, yCursor + 40 + i * 16));

    // Summary chips
    yCursor += 114;
    const chip = (x, y, label, value, colorRGB) => {
      const padX = 8,
        padY = 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const textW = doc.getTextWidth(`${label}: ${value}`);
      const w = textW + padX * 2;
      const h = 22;
      doc.setDrawColor(...colorRGB);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(x, y, w, h, 10, 10, "FD");
      doc.setTextColor(...colorRGB);
      doc.text(`${label}: ${value}`, x + padX, y + 14);
      return w + 8; // spacing
    };

    let chipX = margin;
    chipX += chip(
      chipX,
      yCursor,
      "Opening Balance",
      fmtCurrency(openingBalance),
      brand.gray
    );
    chipX += chip(
      chipX,
      yCursor,
      "Total In",
      fmtCurrency(totalIn),
      brand.emerald
    );
    chipX += chip(
      chipX,
      yCursor,
      "Total Out",
      fmtCurrency(Math.abs(totalOut)),
      brand.rose
    );
    chipX += chip(
      chipX,
      yCursor,
      "Closing Balance",
      fmtCurrency(closingBalance),
      brand.teal
    );

    // Transactions table
    const startY = yCursor + 36;

    const dataForTable = rows.length
      ? rows.map((r) => ({
          date: r.date,
          details: r.details,
          type: r.type,
          status: r.status,
          amountFmt: r.amountFmt,
          balanceFmt: r.balanceFmt,
          _amountRaw: r.amount, // for coloring
        }))
      : [
          {
            date: "",
            details: "No transactions in the selected period.",
            type: "",
            status: "",
            amountFmt: "",
            balanceFmt: "",
          },
        ];

    autoTable(doc, {
      startY,
      head: [["Date", "Details", "Type", "Status", "Amount (ZAR)", "Balance"]],
      body: dataForTable.map((r) => [
        r.date,
        r.details,
        r.type,
        r.status,
        r.amountFmt,
        r.balanceFmt,
      ]),
      theme: "grid",
      styles: {
        font: "helvetica",
        fontSize: 10,
        cellPadding: 6,
        textColor: [51, 65, 85], // slate-700
      },
      headStyles: {
        fillColor: brand.lightTeal,
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: { fillColor: [248, 250, 252] }, // slate-50
      columnStyles: {
        0: { cellWidth: 74 },
        1: { cellWidth: "auto" },
        2: { cellWidth: 70 },
        3: { cellWidth: 70 },
        4: { cellWidth: 100, halign: "right" },
        5: { cellWidth: 100, halign: "right" },
      },
      willDrawCell(data) {
        // Add custom color for amount column
        if (data.section === "body" && data.column.index === 4 && rows.length) {
          const raw = rows[data.row.index]?._amountRaw ?? 0;
          const isNeg = Number(raw) < 0;
          doc.setTextColor(...(isNeg ? brand.rose : brand.emerald));
        } else {
          doc.setTextColor(51, 65, 85);
        }
      },
      didDrawPage: (data) => {
        // Header and footer on every page
        drawHeader(doc);
        const pageNum = doc.internal.getNumberOfPages();
        drawFooter(doc, pageNum, "{total_pages_count_string}");
      },
      margin: { left: margin, right: margin, top: 120, bottom: 60 },
    });

    // Replace total pages placeholder
    if (typeof doc.putTotalPages === "function") {
      doc.putTotalPages(String(doc.internal.getNumberOfPages()));
    }

    // Disclaimer
    const afterTableY = doc.lastAutoTable?.finalY
      ? doc.lastAutoTable.finalY + 20
      : startY + 40;
    if (afterTableY + 60 < pageHeight - 60) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...brand.gray);
      const disclaimer =
        "This statement is provided for your records. If you notice any discrepancies, please contact support@yourbank.com within 14 days.";
      doc.text(disclaimer, margin, afterTableY, {
        maxWidth: pageWidth - margin * 2,
      });
    }

    // Output
    const pdfBuffer = doc.output("arraybuffer");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=YourBank_Statement_${account.accountNumber}.pdf`
    );
    return res.send(Buffer.from(pdfBuffer));
  } catch (error) {
    logger.error("Error generating PDF statement:", {
      error: error.message,
      stack: error.stack,
      accountId: req.params.accountId,
      userId: req.user?.id,
      ip: req.ip,
    });
    return res
      .status(500)
      .json({
        message: "Server error while generating PDF",
        error: error.message,
      });
  }
};

export const emailStatement = async (req, res) => {
  try {
    // Define Color Palette (same as generateStatementPDF)
    const COLOR_SECONDARY_ACCENT_TEAL = "#2D7A8A";
    const COLOR_TEXT_DARK_CHARCOAL = "#333333";
    const COLOR_TEXT_MEDIUM_GREY = "#666666";

    const accountId = req.params.accountId;
    // Populate user details to get name and potentially email (though email comes from req.user)
    // Also populate profile to get address
    const account = await Account.findById(accountId).populate("userId");
    if (!account) return res.status(404).json({ message: "Account not found" });

    const profile = await Profile.findOne({ userId: account.userId._id });
    // Handle case where profile might not exist yet
    const userAddress = profile ? profile.address : "N/A";

    const transactions = await Transaction.find({ accountId }).sort({
      date: -1,
    });

    // --- PDF Generation with Styling (mirrors generateStatementPDF) ---
    const doc = new jsPDF();
    doc.setFont("helvetica"); // Set default font

    // Add Bank Header
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(COLOR_SECONDARY_ACCENT_TEAL);
    doc.text("YourBank", 105, 15, { align: "center" });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(COLOR_TEXT_MEDIUM_GREY);
    doc.text("123 Bank Street, Financial City, 10001", 105, 22, {
      align: "center",
    });
    doc.text("Phone: +1 234 567 890 | Email: support@yourbank.com", 105, 28, {
      align: "center",
    });

    // Reset text color
    doc.setTextColor(COLOR_TEXT_DARK_CHARCOAL);

    // Add Client Information
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(COLOR_SECONDARY_ACCENT_TEAL);
    doc.text("Client Information", 10, 40);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(COLOR_TEXT_DARK_CHARCOAL);
    doc.text(`Name: ${account.userId.name}`, 10, 48);
    doc.text(`Address: ${userAddress}`, 10, 54);

    // Add Account Information
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(COLOR_SECONDARY_ACCENT_TEAL);
    doc.text("Account Information", 10, 66);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(COLOR_TEXT_DARK_CHARCOAL);
    doc.text(`Account Name: ${account.name}`, 10, 74);
    doc.text(`Account Number: ${account.accountNumber}`, 10, 80);
    doc.text(`Balance: R ${account.balance.toFixed(2)}`, 10, 86);

    // Add Transactions Table Header
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(COLOR_SECONDARY_ACCENT_TEAL);
    doc.text("Transaction History", 10, 98);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(COLOR_TEXT_DARK_CHARCOAL);
    doc.text("Date", 10, 106);
    doc.text("Reference", 60, 106);
    doc.text("Amount (R)", 190, 106, { align: "right" });

    // Add Transactions Table Rows
    doc.setFont("helvetica", "normal");
    doc.setTextColor(COLOR_TEXT_DARK_CHARCOAL);
    let y = 114;
    transactions.forEach((transaction) => {
      doc.text(new Date(transaction.date).toLocaleDateString(), 10, y);
      doc.text(transaction.reference || "N/A", 60, y, { maxWidth: 100 });
      doc.text(transaction.amount.toFixed(2), 190, y, { align: "right" });
      y += 8;
      if (y > 280) {
        doc.addPage();
        y = 20;
        // Redraw headers on new page
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(COLOR_TEXT_DARK_CHARCOAL);
        doc.text("Date", 10, y);
        doc.text("Reference", 60, y);
        doc.text("Amount (R)", 190, y, { align: "right" });
        y += 8;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(COLOR_TEXT_DARK_CHARCOAL);
      }
    });
    // --- End PDF Generation ---

    const pdfBuffer = doc.output("arraybuffer");

    // Ensure email configuration is present
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error(
        "Email credentials are not configured in environment variables."
      );
      return res.status(500).json({ message: "Email service not configured." });
    }
    if (!req.user || !req.user.email) {
      console.error("User email not found in request.");
      return res.status(400).json({ message: "User email not available." });
    }

    const transporter = nodemailer.createTransport({
      // Consider using a more robust email service for production
      service: "gmail", // Or another service like SendGrid, Mailgun
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"YourBank" <${process.env.EMAIL_USER}>`, // Use a display name
      to: req.user.email, // Send to the logged-in user's email
      subject: `Your Bank Statement for Account ${account.accountNumber}`, // More specific subject
      text: `Dear ${account.userId.name},\n\nPlease find your bank statement for account ${account.name} (${account.accountNumber}) attached.\n\nRegards,\nYourBank`, // Improved text body
      attachments: [
        {
          filename: `BankStatement_${account.accountNumber}_${
            new Date().toISOString().split("T")[0]
          }.pdf`, // More specific filename
          content: Buffer.from(pdfBuffer),
          contentType: "application/pdf",
        },
      ],
    });

    res.status(200).json({ message: "Bank statement emailed successfully." });
  } catch (error) {
    console.error("Error emailing statement:", error.message, error.stack); // Log stack trace
    res
      .status(500)
      .json({
        message: "Server error while emailing statement",
        error: error.message,
      });
  }
};
