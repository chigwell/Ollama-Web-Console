export const checkOllamaAvailability = async () => {
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    if (!response.ok) {
      return false;
    }
    const data = await response.json();
    return Array.isArray(data.models);
  } catch (error) {
    console.error("Error checking Ollama availability:", error);
    return false;
  }
};
