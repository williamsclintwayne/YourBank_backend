# YourBank - Proof of Payment System Documentation

## 🎯 Overview

The Proof of Payment system provides comprehensive digital receipts for all banking transactions, featuring:

- **Professional PDF Receipts** - Bank-quality formatted documents
- **QR Code Verification** - Each receipt includes a QR code for verification
- **Secure Access Control** - Users can only access their own transaction proofs
- **Bulk Generation** - Generate multiple proofs at once
- **Automatic Cleanup** - Old receipt files are automatically deleted

---

## 📋 Features Implemented

### ✅ Core Features
- [x] Professional PDF receipt generation with bank branding
- [x] Unique transaction ID generation for every transaction
- [x] QR code generation for transaction verification
- [x] Secure file storage and access control
- [x] Transaction history with proof status
- [x] Bulk proof generation (up to 10 at once)
- [x] Public verification endpoint for QR codes
- [x] Automatic cleanup of old receipt files (30+ days)

### ✅ Security Features
- [x] JWT authentication for all protected endpoints
- [x] User ownership verification for transactions
- [x] Secure file access with user validation
- [x] Transaction ID uniqueness enforcement

### ✅ Performance Features
- [x] Efficient PDF generation using jsPDF
- [x] Database indexing for fast transaction queries
- [x] File cleanup to prevent storage bloat
- [x] Pagination support for transaction history

---

## 🔗 API Endpoints

### Protected Endpoints (Require Authentication)

#### Generate Proof of Payment
```http
POST /api/proof-of-payment/generate/{transactionId}
```
- **Description**: Generate a PDF proof of payment for a specific transaction
- **Authentication**: Required (Bearer Token)
- **Response**: JSON with download URL and file details

#### Download Proof PDF
```http
GET /api/proof-of-payment/download/{transactionId}
```
- **Description**: Download PDF proof as attachment
- **Authentication**: Required (Bearer Token)
- **Response**: PDF file download

#### View Proof PDF
```http
GET /api/proof-of-payment/view/{transactionId}
```
- **Description**: View PDF proof in browser
- **Authentication**: Required (Bearer Token)
- **Response**: PDF file for inline viewing

#### Get Transaction History
```http
GET /api/proof-of-payment/history?page=1&limit=20
```
- **Description**: Get paginated transaction history with proof status
- **Authentication**: Required (Bearer Token)
- **Query Parameters**:
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 20)

#### Get Proof Status
```http
GET /api/proof-of-payment/status/{transactionId}
```
- **Description**: Get proof generation status for a transaction
- **Authentication**: Required (Bearer Token)
- **Response**: Proof status and transaction details

#### Bulk Generate Proofs
```http
POST /api/proof-of-payment/bulk-generate
Content-Type: application/json

{
  "transactionIds": ["YB12345ABC", "YB67890DEF"]
}
```
- **Description**: Generate proofs for multiple transactions (max 10)
- **Authentication**: Required (Bearer Token)
- **Request Body**: Array of transaction IDs

### Public Endpoints

#### Verify Transaction
```http
GET /api/proof-of-payment/verify/{transactionId}
```
- **Description**: Verify transaction details (used by QR codes)
- **Authentication**: Not required
- **Response**: Transaction verification details

---

## 💾 Database Schema Updates

### Transaction Model Enhancements
```javascript
{
  accountId: ObjectId,          // Reference to Account
  type: String,                 // 'Credit' or 'Debit'
  amount: Number,               // Transaction amount
  reference: String,            // User-provided reference
  date: Date,                   // Transaction timestamp
  
  // New fields for proof of payment
  transactionId: String,        // Unique transaction ID (YB12345ABC)
  status: String,               // 'Pending', 'Completed', 'Failed'
  fromAccount: String,          // Source account number
  toAccount: String,            // Destination account number
  description: String,          // Transaction description
  balanceAfter: Number,         // Account balance after transaction
  fee: Number,                  // Transaction fee (default: 0)
  proofGenerated: Boolean       // Track if proof was generated
}
```

### Indexes Added
- `{ accountId: 1, date: -1 }` - For efficient user transaction queries
- `{ transactionId: 1 }` - For unique transaction ID lookups
- `{ fromAccount: 1 }` - For sender account queries
- `{ toAccount: 1 }` - For recipient account queries

---

## 📄 PDF Receipt Features

### Professional Layout
- **Header**: Bank branding with blue color scheme
- **Status Badge**: Green "COMPLETED" status indicator
- **Transaction Details**: ID, date/time, reference, amount, fees
- **Sender Information**: Name, account number, account type
- **Recipient Information**: Name, account number, account type
- **QR Code**: For verification with embedded transaction data
- **Security Watermark**: "YOURBANK" diagonal watermark
- **Footer**: Contact information and generation timestamp

### QR Code Content
```json
{
  "transactionId": "YB12345ABC",
  "amount": 1000.00,
  "date": "2025-08-02T10:30:00.000Z",
  "reference": "Payment for services",
  "verification": "https://yourbank.com/verify/YB12345ABC"
}
```

---

## 🚀 Frontend Integration Guide

### 1. Service Layer
```javascript
// proofOfPaymentService.js
class ProofOfPaymentService {
  async generateProof(transactionId) {
    const response = await axios.post(`/api/proof-of-payment/generate/${transactionId}`);
    return response.data;
  }

  async downloadProof(transactionId) {
    const response = await axios.get(`/api/proof-of-payment/download/${transactionId}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  async getTransactionHistory(page = 1, limit = 20) {
    const response = await axios.get(`/api/proof-of-payment/history?page=${page}&limit=${limit}`);
    return response.data;
  }
}
```

### 2. React Components

#### Transaction History Component
```jsx
const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleGenerateProof = async (transactionId) => {
    try {
      setLoading(true);
      await ProofOfPaymentService.generateProof(transactionId);
      toast.success('Proof generated successfully!');
      // Refresh transaction list
      fetchTransactions();
    } catch (error) {
      toast.error('Failed to generate proof');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadProof = async (transactionId) => {
    try {
      const blob = await ProofOfPaymentService.downloadProof(transactionId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `proof_${transactionId}.pdf`;
      link.click();
    } catch (error) {
      toast.error('Failed to download proof');
    }
  };

  return (
    <div className="transaction-history">
      {transactions.map(transaction => (
        <div key={transaction.id} className="transaction-item">
          <div className="transaction-details">
            <span>{transaction.reference}</span>
            <span>{formatCurrency(transaction.amount)}</span>
            <span>{formatDate(transaction.date)}</span>
          </div>
          <div className="transaction-actions">
            {transaction.canGenerateProof && (
              <>
                {!transaction.proofGenerated ? (
                  <button
                    onClick={() => handleGenerateProof(transaction.transactionId)}
                    disabled={loading}
                    className="btn-generate"
                  >
                    Generate Proof
                  </button>
                ) : (
                  <button
                    onClick={() => handleDownloadProof(transaction.transactionId)}
                    className="btn-download"
                  >
                    Download Proof
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
```

### 3. Bulk Operations Component
```jsx
const BulkProofGenerator = () => {
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const [generating, setGenerating] = useState(false);

  const handleBulkGenerate = async () => {
    try {
      setGenerating(true);
      const result = await ProofOfPaymentService.bulkGenerate(selectedTransactions);
      toast.success(`Generated ${result.summary.successful} proofs successfully`);
    } catch (error) {
      toast.error('Bulk generation failed');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="bulk-generator">
      <div className="selection-summary">
        {selectedTransactions.length} transactions selected
      </div>
      <button
        onClick={handleBulkGenerate}
        disabled={generating || selectedTransactions.length === 0}
        className="btn-bulk-generate"
      >
        {generating ? 'Generating...' : 'Generate All Proofs'}
      </button>
    </div>
  );
};
```

---

## 🧪 Testing Commands

### 1. Test Proof Generation
```bash
# Generate proof for a transaction
curl -X POST "http://localhost:5000/api/proof-of-payment/generate/YB12345ABC" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Download proof PDF
curl -X GET "http://localhost:5000/api/proof-of-payment/download/YB12345ABC" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  --output proof.pdf

# Get transaction history
curl -X GET "http://localhost:5000/api/proof-of-payment/history?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. Test Public Verification
```bash
# Verify transaction (no auth required)
curl -X GET "http://localhost:5000/api/proof-of-payment/verify/YB12345ABC"
```

### 3. Test Bulk Generation
```bash
curl -X POST "http://localhost:5000/api/proof-of-payment/bulk-generate" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"transactionIds": ["YB12345ABC", "YB67890DEF"]}'
```

---

## 🔒 Security Considerations

### Access Control
- All proof-related endpoints require JWT authentication
- Users can only generate/download proofs for their own transactions
- Transaction ownership is verified before any operation

### File Security
- PDF files are stored in a secure directory outside web root
- File access is controlled through API endpoints only
- Old files are automatically cleaned up to prevent storage bloat

### Data Validation
- Transaction IDs are validated for format and existence
- User ownership is verified for every transaction operation
- Input sanitization prevents injection attacks

---

## 📊 Performance Optimization

### Database Optimization
- Strategic indexing for fast transaction queries
- Pagination support for large transaction histories
- Efficient user ownership verification

### File Management
- Automatic cleanup of old receipt files
- Efficient PDF generation using optimized libraries
- Memory-conscious file operations

### API Optimization
- Bulk operations for multiple proof generation
- Streaming file downloads for large PDFs
- Proper HTTP headers for caching and security

---

## 🛠 Maintenance

### Daily Cleanup Job
The system automatically cleans up PDF files older than 30 days:
```javascript
// Runs daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  await ProofOfPaymentService.cleanupOldReceipts();
});
```

### Monitoring
- Track proof generation rates
- Monitor storage usage
- Alert on cleanup job failures

### Backup Considerations
- Transaction data is permanent in database
- PDF files are regenerable, no backup needed
- Consider archiving very old transactions

---

## 🚨 Error Handling

### Common Errors
- **404 Transaction Not Found**: Invalid transaction ID
- **403 Access Denied**: User doesn't own the transaction
- **500 PDF Generation Failed**: System error during PDF creation

### Error Responses
```json
{
  "message": "Transaction not found",
  "error": "No transaction exists with ID: YB12345ABC"
}
```

### Recovery Actions
- Retry PDF generation for temporary failures
- Validate transaction IDs before API calls
- Implement proper error boundaries in frontend

---

This comprehensive proof of payment system provides professional, secure, and user-friendly digital receipts for all banking transactions, enhancing the overall user experience and providing audit trails for financial records.
