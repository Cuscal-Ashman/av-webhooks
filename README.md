# Account Verification with Webhooks

This project extends the original [Account Verification](https://github.com/basiqio-oss/account-verification-v3) repository by integrating webhook subscriptions from Basiq. Instead of polling the API for updates, this implementation subscribes to the `transactions.updated` event, enabling real-time updates.

## 🚀 Why Webhooks?

### ✅ Advantages of Webhooks Over Polling
- **Real-time Updates** – Immediate notification when events occur.
- **Reduced API Calls** – Eliminates frequent polling requests.
- **More Efficient** – Optimizes resource usage and performance.
- **Scalable** – Handles high-frequency updates without excessive API usage.

### ❌ Potential Drawbacks
- **Setup Complexity** – Requires publicly accessible webhook endpoints.
- **Reliability Risks** – Must handle retries and logging in case of failures.
- **Security Considerations** – Webhooks must be properly authenticated.

## 🛠️ Technologies Used

- **[Basiq API](https://api.basiq.io)** – CDR-accredited financial data API.
- **[Next.js](https://nextjs.org/)** – React framework with server-side rendering.
- **[TailwindCSS](https://tailwindcss.com/)** – Utility-first CSS framework.

## 📖 Getting Started

### 1️⃣ Clone the Repository

```sh
git clone git@github.com:<your_username>/account-verification.git
cd account-verification
