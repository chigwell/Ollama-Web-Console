import React, { useState, useEffect } from 'react';
import { checkOllamaAvailability } from '../utils/utilities';


function ListModelDetails() {

  const [isLoading, setIsLoading] = useState(true);
  const [models, setModels] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const available = await checkOllamaAvailability();
      if (available) {
        fetch('http://localhost:11434/api/tags')
          .then(response => response.json())
          .then(data => {
            setModels(data.models);
            setIsLoading(false);
          })
          .catch(err => {
            setError("Failed to fetch models: " + err.message);
            setIsLoading(false);
          });
      } else {
        setError("Ollama API is not available");
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <h1>OLlama Models</h1>
      {isLoading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>Error: {error}</p>
      ) : (
        <ul>
          {models.map((model, index) => (
            <li key={index}>
              <strong>Name:</strong> {model.name} <br />
              <strong>Modified At:</strong> {model.modified_at} <br />
              <strong>Size:</strong> {model.size} bytes <br />
              <strong>Details:</strong> {model.details.format}, {model.details.family}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ListModelDetails;
