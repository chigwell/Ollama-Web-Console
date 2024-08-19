import React, { useState, useEffect } from 'react';
import Terminal, { ColorMode, TerminalInput, TerminalOutput } from 'react-terminal-ui';
import store from 'store-js';
import { checkOllamaAvailability } from '../utils/utilities';


const TerminalController = (props = {}) => {
  if (store.get('color') === undefined) {
    store.set('color', 'dark');
  }
  if (store.get('ollama-available') === undefined) {
    store.set('ollama-available', false);
  }

  const [colorMode, setColorMode] = useState('dark' === store.get('color') ? ColorMode.Dark : ColorMode.Light);
  const [lineData, setLineData] = useState([
    <TerminalOutput key="welcome-0"></TerminalOutput>
  ]);



  useEffect(() => {
    const updateWelcomeMessage = async () => {
    const ollamaAvailability = await checkOllamaAvailability();
    let welcomeMessage = ollamaAvailability
      ? "Welcome to the Ollama Web Console! 👋"
      : "Ollama is not available. Please run ollama locally.";

    if (getMessage("welcome-0") !== welcomeMessage) {
      lineData[0] = <TerminalOutput key="welcome-0">{welcomeMessage}</TerminalOutput>;
      setLineData([...lineData]);
    }

    store.set('ollama-available', ollamaAvailability);
  };
    updateWelcomeMessage();
    const interval = setInterval(updateWelcomeMessage, 5000);

    return () => clearInterval(interval);
  }, [lineData, setLineData]);

  const typeMessage = async (ld, message, message_id = null, delay = 25) => {
    let mkey = message_id === null ? `message-${ld.length}` :  message_id;

    for (let i = 0; i < message.length; i++) {
        let lastValue = "";

        if (i === 0) {
            ld.push(<TerminalOutput key={mkey}>{message[i]}</TerminalOutput>);
            setLineData([...ld]);
        } else {
            for (let j = 0; j < ld.length; j++) {
                if (ld[j].key === mkey) {
                    lastValue = ld[j].props.children + message[i];
                    if (lastValue !== undefined) {
                        ld[j] = <TerminalOutput key={mkey}>{lastValue}</TerminalOutput>;
                        setLineData([...ld]);
                    }
                    break;
                }
            }
        }
        await new Promise(resolve => setTimeout(resolve, delay));
    }
  };

  const addToHistory = (input) => {
    if( store.get('history')  === undefined ) {
        store.set('history', []);
    }
    let history = store.get('history');
    history.push(input);

    if(history.length > 10) {
        history.shift();
    }
    store.set('history', history);
  }

  const clearHistory = () => {
    store.set('history', []);
  }

  const onInput = (input) => {
    addToHistory(input);
    let ld = [...lineData];
    const inputKey = `input-${ld.length}`;
    ld.push(<TerminalInput key={inputKey}>{input}</TerminalInput>);
    setLineData(ld);
    switch(input) {
        case 'help':
            help(ld)
            break;
        case 'toggle-color-mode':
            toggleColorMode();
            break;
        case 'clear-history':
            clearHistory();
            break;
        default:
            if (store.get('ollama-available')) {
                chat(input, ld);
            }
            else {
               help(ld);
            }
            break;
    }
  }

  const chat = async (input, ld) => {
      const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: "llama3.1:8b",
          prompt: input,
          stream: true
        })
      };

      try {
        const latestMessage = `output-${lineData.length}-`+Math.random();
        const newLineData = <TerminalOutput key={latestMessage} />;
        ld.push(newLineData);
        setLineData(ld);

        const response = await fetch("http://localhost:11434/api/generate", requestOptions);
        const reader = response.body.getReader();

        const processChunk = async ({ done, value }) => {
          if (done) {
            console.log("Stream complete");
            return;
          }

          const chunkText = new TextDecoder().decode(value);
          console.log(chunkText);

          const chunk = JSON.parse(chunkText);
          if (chunk.done === false && chunk.response !== undefined) {
            const output = chunk.response ? chunk.response : "";
            setLineData((prevLineData) => {
              const index = prevLineData.findIndex(line => line.key === latestMessage);
              if (index !== -1) {
                const existingText = prevLineData[index].props.children || "";
                const updatedLine = React.cloneElement(prevLineData[index], {
                  children: existingText + output
                });
                return [...prevLineData.slice(0, index), updatedLine, ...prevLineData.slice(index + 1)];
              }
              return prevLineData;
            });
          }

          reader.read().then(processChunk);
        };

        reader.read().then(processChunk);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };

  const getMessage = (message_id) => {
    let ld = [...lineData];
    for (let i = 0; i < ld.length; i++) {
        if (ld[i].key === message_id) {
            return ld[i].props.children;
        }
    }
  }

  const help = async (ld) => {
      await typeMessage(ld, "Available commands:", "help-0-" + Math.random() );
      await typeMessage(ld, "help - display this help message", "help-1-" + Math.random() );
      await typeMessage(ld, "toggle-color-mode - toggle between light and dark mode", "help-2-" + Math.random() );
      await typeMessage(ld, "clear-history - clear the command history", "help-3-" + Math.random() );
  }

  const toggleColorMode = () => {
    const newColorMode = colorMode === ColorMode.Light ? ColorMode.Dark : ColorMode.Light;
    store.set('color', newColorMode === ColorMode.Light ? 'light' : 'dark');
    setColorMode(newColorMode);
  }

  const redBtnClick = () => {
    console.log("Clicked the red button.");
  }

  const yellowBtnClick = () => {
    console.log("Clicked the yellow button.");
  }

  const greenBtnClick = () => {
    console.log("Clicked the green button.");
  }

  return (
    <div className="container">
      <Terminal
        name='Ollama Web Console'
        colorMode={ colorMode }
        onInput={ onInput }
        redBtnCallback={ redBtnClick }
        yellowBtnCallback={ yellowBtnClick }
        greenBtnCallback={ greenBtnClick }
      >
        { lineData }
      </Terminal>
    </div>
  )
};

export default TerminalController;
