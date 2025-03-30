import React, { useState, useEffect } from "react";
import { ethers } from "ethers";

const Healthcare = () => {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [isOwner, setIsOwner] = useState(false);

  const [patientID, setPatientID] = useState("");
  const [patientName, setPatientName] = useState(""); // New state for patient name
  const [diagnosis, setDiagnosis] = useState("");
  const [treatment, setTreatment] = useState("");
  const [providerAddress, setProviderAddress] = useState("");
  const [patientRecords, setPatientRecords] = useState([]);

  const contractAddress = "0x7F798373900D3bA98a352b44f2cd3FF7C891Ede8";
  const contractABI = [
    {
      inputs: [
        { internalType: "uint256", name: "patientId", type: "uint256" },
        { internalType: "string", name: "patientName", type: "string" }, // Added patientName
        { internalType: "string", name: "diagnosis", type: "string" },
        { internalType: "string", name: "treatment", type: "string" },
      ],
      name: "addRecord",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ internalType: "address", name: "provider", type: "address" }],
      name: "authorizeProvider",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "getOwner",
      outputs: [{ internalType: "address", name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ internalType: "uint256", name: "patientId", type: "uint256" }],
      name: "getPatientRecord",
      outputs: [
        {
          components: [
            { internalType: "uint256", name: "recordId", type: "uint256" },
            { internalType: "string", name: "patientName", type: "string" },
            { internalType: "string", name: "diagnosis", type: "string" },
            { internalType: "string", name: "treatment", type: "string" },
            { internalType: "uint256", name: "timestamp", type: "uint256" },
          ],
          internalType: "struct HealthCareRecords.Record[]",
          name: "",
          type: "tuple[]",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
  ];

  useEffect(() => {
    const connectWallet = async () => {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        const accountAddress = await signer.getAddress();
        setAccount(accountAddress);

        const contract = new ethers.Contract(contractAddress, contractABI, signer);
        setContract(contract);

        const ownerAddress = await contract.getOwner();
        setIsOwner(accountAddress.toLowerCase() === ownerAddress.toLowerCase());
      } catch (error) {
        console.error("Error connecting to wallet: ", error);
      }
    };

    connectWallet();
  }, []);

  const fetchPatientRecords = async () => {
    try {
      if (!contract) return;
      if (!patientID) {
        alert("Please enter a valid Patient ID");
        return;
      }
      const records = await contract.getPatientRecord(ethers.BigNumber.from(patientID));
      console.log(records);
      
      // Update record ID dynamically based on fetched data
      const updatedRecords = records.map((record, index) => ({
        recordId: index + 1, // Assign record ID dynamically
        patientName: record.patientName, // Include patient name
        diagnosis: record.diagnosis,
        treatment: record.treatment,
        timestamp: record.timestamp,
      }));
      
      setPatientRecords(updatedRecords);
    } catch (error) {
      console.error("Error fetching patient records", error);
    }
  };

  const addRecord = async () => {
    try {
      if (!contract) return;
      if (!patientID || !patientName || !diagnosis || !treatment) {
        alert("Please fill in all fields before adding a record.");
        return;
      }
      const tx = await contract.addRecord(
        ethers.BigNumber.from(patientID), // Ensure patientID is a BigNumber
        patientName, // Include patientName
        diagnosis,
        treatment
      );
      await tx.wait();
      fetchPatientRecords();
      alert("Record added successfully");
    } catch (error) {
      console.error("Error adding record:", error);
    }
  };

  const authorizeProvider = async () => {
    if (!contract) return;
    if (!providerAddress) {
      alert("Please enter a valid provider address.");
      return;
    }
    if (isOwner) {
      try {
        const tx = await contract.authorizeProvider(providerAddress);
        await tx.wait();
        alert(`Provider ${providerAddress} authorized successfully`);
      } catch (error) {
        console.error("Error authorizing provider", error);
      }
    } else {
      alert("Only contract owner can call this function");
    }
  };

  return (
    <div className="container">
      <h1 className="title">HealthCare Application</h1>
      {account && <p className="account-info">Connected Account: {account}</p>}
      {isOwner && <p className="owner-info">You are the contract owner</p>}

      <div className="form-section">
        <h2>Fetch Patient Records</h2>
        <input
          className="input-field"
          type="text"
          placeholder="Enter Patient ID"
          value={patientID}
          onChange={(e) => setPatientID(e.target.value)}
        />
        <button className="action-button" onClick={fetchPatientRecords}>
          Fetch Records
        </button>
      </div>

      <div className="form-section">
        <h2>Add Patient Record</h2>
        <input
          className="input-field"
          type="text"
          placeholder="Patient ID (number)"
          value={patientID}
          onChange={(e) => setPatientID(e.target.value)}
        />
        <input
          className="input-field"
          type="text"
          placeholder="Patient Name"
          value={patientName}
          onChange={(e) => setPatientName(e.target.value)}
        />
        <input
          className="input-field"
          type="text"
          placeholder="Diagnosis"
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
        />
        <input
          className="input-field"
          type="text"
          placeholder="Treatment"
          value={treatment}
          onChange={(e) => setTreatment(e.target.value)}
        />
        <button className="action-button" onClick={addRecord}>
          Add Record
        </button>
      </div>

      <div className="form-section">
        <h2>Authorize HealthCare Provider</h2>
        <input
          className="input-field"
          type="text"
          placeholder="Provider Address"
          value={providerAddress}
          onChange={(e) => setProviderAddress(e.target.value)}
        />
        <button className="action-button" onClick={authorizeProvider}>
          Authorize Provider
        </button>
      </div>

      <div className="records-section">
        <h2>Patient Records</h2>
        {patientRecords.length > 0 ? (
          patientRecords.map((record, index) => (
            <div key={index} className="record-card">
              <p><strong>Record ID:</strong> {record.recordId}</p>
              <p><strong>Patient Name:</strong> {record.patientName}</p>
              <p><strong>Diagnosis:</strong> {record.diagnosis}</p>
              <p><strong>Treatment:</strong> {record.treatment}</p>
              <p><strong>Timestamp:</strong> {new Date(record.timestamp.toNumber() * 1000).toLocaleString()}</p>
            </div>
          ))
        ) : (
          <p>No records found.</p>
        )}
      </div>
    </div>
  );
};

export default Healthcare;
