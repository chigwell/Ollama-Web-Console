import React, { useState, useEffect } from 'react';
import Terminal, { ColorMode, TerminalInput, TerminalOutput } from 'react-terminal-ui';
import store from 'store-js';
import { checkOllamaAvailability } from '../utils/utilities';


const BASE_URL = "http://localhost:11434/api";
const GENERATE_URL = BASE_URL + "/generate";
const CHAT_URL = BASE_URL + "/chat";
const LIST_MODELS_URL = BASE_URL + "/tags";

const MODEL = "llama3.1:8b";
const HISTORY_SIZE = 10;


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

  const addToHistory = (input, role="user", timestamp=new Date().toISOString()) => {
    if( store.get('history')  === undefined ) {
        store.set('history', []);
    }
    console.log(store.get('history'))
    let history = store.get('history');
    history.push({"role": role, "content": input, "timestamp": timestamp});

    if(history.length > HISTORY_SIZE) {
        history.shift();
    }
    store.set('history', history);
  }

  const clearHistory = () => {
    store.set('history', []);
  }

  const onInput = (input) => {
    addToHistory(input, "user");
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
      console.log(store.get('history'))
      const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: MODEL,
          messages: store.get('history'),
          stream: true
        })
      };

      try {
        const latestMessage = `output-${lineData.length}-`+Math.random();
        const newLineData = <TerminalOutput key={latestMessage}/>;
        ld.push(newLineData);
        setLineData(ld);

        const response = await fetch(CHAT_URL, requestOptions);
        const reader = response.body.getReader();

        const processChunk = async ({ done, value }) => {
          if (done) {
            const latestMessage = lineData[lineData.length - 1].props.children;
            console.log("latestMessage: ", latestMessage);
            addToHistory(latestMessage, "assistant");
            return;
          }

          const chunkText = new TextDecoder().decode(value);

          const chunk = JSON.parse(chunkText);
          if (chunk.done === false && chunk.message.content !== undefined) {
            const output = chunk.message.content ? chunk.message.content : "";
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
    const ld = [...lineData];
    for (let i = 0; i < ld.length; i++) {
        if (ld[i].key === message_id) {
            return ld[i].props.children;
        }
    }
  }

  const help = async (ld) => {
      const lastMessageNumber = ld.length;
      await typeMessage(ld, "Available commands:", "help-" + lastMessageNumber + "-" + Math.random() );
      await typeMessage(ld, "help - display this help message", "help-" + lastMessageNumber + "-" + Math.random() );
      await typeMessage(ld, "toggle-color-mode - toggle between light and dark mode", "help-"+ lastMessageNumber + "-" + Math.random() );
      await typeMessage(ld, "clear-history - clear the command history", "help-" + lastMessageNumber + "-" + Math.random() );
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
