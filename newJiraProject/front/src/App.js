import logo from "./logo.svg";
import "./App.css";

import React, { useEffect } from "react";
import axios from "axios";
import { io } from "socket.io-client";
const socket = io("http://localhost:3000"); //  the URL FOR SOCKET.IO SERVER
function App() {
  const [issues, setIssues] = React.useState([]);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");


  const [filter, setFilter] = React.useState([]);

  // fetch issues from the server
  const fetchIssues = async () => {
    try {
      const response = await axios.get(
        `http://localhost:3000/issues${
          filter !== "all" ? `?status=${filter}` : ""
        }`
      );
      setIssues(response.data);
    } catch (error) {
      console.error("Error fetching issues:", error);
    }
  };

  useEffect(() => {
    fetchIssues();

    socket.on("newIssue", (newIssue) => {
      setIssues((prevIssues) => [newIssue, ...prevIssues]);
    });

    socket.on("updateIssue", (updated) => {
      setIssues((prev) =>
        prev.map((i) => (i._id === updated._id ? updated : i))
      );
    });

    return () => {
      socket.off("newIssue");
      socket.off("updateIssue");
    };
  }, [filter]);

  // create issue
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description) {
      alert("Title and description are required");
      return;
    }
    try {
      const response = await axios.post("http://localhost:3000/issues", {
        title,
        description,
      });
      setTitle("");
      setDescription("");
      console.log("Issue created:", response.data);
    } catch (error) {
      console.error("Error creating issue:", error);
    } finally {
      fetchIssues(); // Refresh the issue list after creating a new issue
    }
  };

  // resolve issue
  const handleResolve = async (id) => {
    try {
      const response = await axios.put(
        `http://localhost:3000/issues/${id}/resolved`
      );
      console.log("Issue resolved:", response.data);
    } catch (error) {
      console.error("Error resolving issue:", error);
    }
  };

  return (
    <div className="App">
      <div>
        <h2> Issue Tracker</h2>
        {/* create form */}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={{margin:"10px"}}
          />
          <br/>
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            style={{margin:"10px"}}

          />
          <button type="submit" style={{margin:"10px"}}>Create Issue</button>
        </form>

        {/* filter */}

        <div>
          <label>Filter by status:</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        {/* show */}
        <ul>
          {issues.map((issue) => (
            <li key={issue._id}>
              <h3>{issue.title}</h3>
              <p>{issue.description}</p>
              <p>Status: {issue.status}</p>
              {/* <p>Created At: {new Date(issue.createdAt).toLocaleString()}</p>
      <p>Updated At: {new Date(issue.updatedAt).toLocaleString()}</p> */}
              {issue.status === "open" && (
                <button onClick={() => handleResolve(issue._id)}>
                  Resolve
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
