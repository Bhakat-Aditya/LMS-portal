// src/pages/PaymentStatus.jsx
import { useEffect } from "react";
import { useParams, Link } from "react-router-dom"; // Changed this line to react-router-dom

const PaymentStatus = () => {
  const { transactionId } = useParams();

  return (
    <div className="max-w-md mx-auto mt-20 text-center bg-white border p-8 rounded-lg shadow-sm">
      <div className="text-5xl mb-4">✅</div>
      <h2 className="text-2xl font-bold mb-2 text-gray-950">
        Payment Complete!
      </h2>
      <p className="text-gray-600 mb-6 text-sm">
        Transaction Reference:{" "}
        <span className="font-mono bg-gray-100 px-1 py-0.5 rounded text-xs">
          {transactionId}
        </span>
      </p>
      <p className="text-gray-700 mb-6">
        PhonePe has processed your payment. Your course access will unlock
        immediately once the background webhook syncs.
      </p>
      <Link
        to="/"
        className="inline-block bg-black text-white font-bold px-6 py-2.5 rounded hover:bg-gray-800 transition-colors"
      >
        Go to Home Catalog
      </Link>
    </div>
  );
};

export default PaymentStatus;
