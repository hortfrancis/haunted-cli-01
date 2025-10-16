import { useState, useRef, useEffect } from 'react';
import './CLIEmulator.css';

interface FileSystemItem {
  type: 'file' | 'dir';
  children?: string[];
  content?: string;
}

interface FileSystem {
  [path: string]: FileSystemItem;
}

interface HistoryEntry {
  cmd: string;
  cwd: string;
  result?: string;
  ghost?: boolean;
}

const CLIEmulator = () => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [input, setInput] = useState<string>('');
  const [cwd, setCwd] = useState<string>('/home/user');
  const [fileSystem, setFileSystem] = useState<FileSystem>({
    '/': {
      type: 'dir',
      children: ['home', 'etc', 'var']
    },
    '/home': {
      type: 'dir',
      children: ['user']
    },
    '/home/user': {
      type: 'dir',
      children: ['documents', 'projects', 'readme.txt']
    },
    '/home/user/documents': {
      type: 'dir',
      children: ['notes.txt', 'todo.txt']
    },
    '/home/user/projects': {
      type: 'dir',
      children: ['app.js', 'package.json']
    },
    '/home/user/readme.txt': {
      type: 'file',
      content: 'Welcome to the CLI emulator!\nTry commands like: ls, cd, cat, pwd, clear, help'
    },
    '/home/user/documents/notes.txt': {
      type: 'file',
      content: 'Meeting notes:\n- Review Q4 goals\n- Plan team outing\n- Update documentation'
    },
    '/home/user/documents/todo.txt': {
      type: 'file',
      content: 'TODO:\n[ ] Fix bug in login\n[x] Write tests\n[ ] Deploy to staging'
    },
    '/home/user/projects/app.js': {
      type: 'file',
      content: 'console.log("Hello, World!");\n\nfunction main() {\n  return "CLI Emulator";\n}'
    },
    '/home/user/projects/package.json': {
      type: 'file',
      content: '{\n  "name": "cli-emulator",\n  "version": "1.0.0"\n}'
    },
    '/etc': {
      type: 'dir',
      children: ['config.txt']
    },
    '/etc/config.txt': {
      type: 'file',
      content: 'System configuration file'
    },
    '/var': {
      type: 'dir',
      children: ['log']
    },
    '/var/log': {
      type: 'dir',
      children: ['system.log']
    },
    '/var/log/system.log': {
      type: 'file',
      content: '[2025-10-13 10:00:00] System started\n[2025-10-13 10:01:23] User logged in'
    }
  });
  const [glitchText, setGlitchText] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  const hauntedMessages = [
    'help me',
    'i am still here',
    'why did you leave me',
    'get out',
    'behind you',
    'do you remember',
    'it hurts',
    'hello?',
    'please',
    'ERROR: ENTITY_NOT_FOUND'
  ];

    const corruptText = (text: string): string => {
    const glitchChars = '!@#$%^&*()_+-=[]{}|;:,.<>?~`';
    let corrupted = '';
    for (let i = 0; i < text.length; i++) {
      if (Math.random() < 0.3) {
        corrupted += glitchChars[Math.floor(Math.random() * glitchChars.length)];
      } else {
        corrupted += text[i];
      }
    }
    return corrupted;
  };

  const addGhostFile = (): string => {
    const ghostFiles = [
      { path: '/home/user/WHO_AM_I.txt', content: 'You should not have opened this.\n\nI have been waiting.\n\n...waiting for you.' },
      { path: '/home/user/documents/HELP.txt', content: 'HELP HELP HELP HELP HELP\nHELP HELP HELP HELP HELP\nHELP HELP HELP HELP HELP' },
      { path: '/home/user/memory.txt', content: 'Do you remember what you did?\n\nI remember.\n\nI remember everything.' },
      { path: '/home/user/documents/forgotten.txt', content: 'They told me you would come back.\nBut you never did.\nWhy?' },
      { path: '/var/log/????.log', content: '[CORRUPTED DATA]\n[ENTITY DETECTED]\n[SYSTEM COMPROMISED]\n[̷̢̛̲̲̥̲͚̗͍̖͔̠̏̈́̀̊̽̒͒͌͋͌̚͜R̵̢̼̹̗̩͔̖͓͙̳̂͂̅̄̈́͜͠U̸̧̨̘͇̤̳͙͚̝͎̐̊̈́̏̀̕͜N̵̡̢̛͚̼̖̬͚̳͈̭̔̉̋̌̅̈́̋]' }
    ];

    const ghost = ghostFiles[Math.floor(Math.random() * ghostFiles.length)];
    const dirPath = ghost.path.substring(0, ghost.path.lastIndexOf('/'));
    const fileName = ghost.path.substring(ghost.path.lastIndexOf('/') + 1);

    setFileSystem(prev => {
      const newFs = { ...prev };
      if (newFs[dirPath] && !newFs[dirPath].children?.includes(fileName)) {
        newFs[dirPath] = {
          ...newFs[dirPath],
          children: [...(newFs[dirPath].children || []), fileName]
        };
        newFs[ghost.path] = {
          type: 'file',
          content: ghost.content
        };
      }
      return newFs;
    });

    return ghost.path;
  };

  const removeRandomFile = (): void => {
    const paths = Object.keys(fileSystem).filter(p => 
      fileSystem[p].type === 'file' && !p.includes('WHO_AM_I') && !p.includes('HELP')
    );
    if (paths.length > 0) {
      const toRemove = paths[Math.floor(Math.random() * paths.length)];
      const dirPath = toRemove.substring(0, toRemove.lastIndexOf('/'));
      const fileName = toRemove.substring(toRemove.lastIndexOf('/') + 1);

      setFileSystem(prev => {
        const newFs = { ...prev };
        if (newFs[dirPath]) {
          newFs[dirPath] = {
            ...newFs[dirPath],
            children: newFs[dirPath]?.children?.filter((f: string) => f !== fileName) || []
          };
          delete newFs[toRemove];
        }
        return newFs;
      });
    }
  };

  const hauntedEvent = (): void => {
    const events = [
      () => {
        // Ghost command
        const ghostCommands = ['ls', 'pwd', 'cat readme.txt', 'help', 'cd ..'];
        const cmd = ghostCommands[Math.floor(Math.random() * ghostCommands.length)];
        setTimeout(() => executeCommand(cmd, true), 500);
      },
      () => {
        // Mysterious message
        const msg = hauntedMessages[Math.floor(Math.random() * hauntedMessages.length)];
        setHistory(prev => [...prev, { 
          cmd: '', 
          cwd: '', 
          result: `\n>>> ${msg} <<<\n`,
          ghost: true 
        }]);
      },
      () => {
        // Add ghost file
        const path = addGhostFile();
        setHistory(prev => [...prev, { 
          cmd: '', 
          cwd: '', 
          result: `[FILE MATERIALIZED: ${path}]`,
          ghost: true 
        }]);
      },
      () => {
        // Remove file
        removeRandomFile();
        setHistory(prev => [...prev, { 
          cmd: '', 
          cwd: '', 
          result: `[FILE DELETED]`,
          ghost: true 
        }]);
      },
      () => {
        // Glitch effect
        const glitch = corruptText('SYSTEM ERROR SYSTEM ERROR SYSTEM ERROR');
        setGlitchText(glitch);
        setTimeout(() => setGlitchText(''), 1000);
      },
      () => {
        // Change directory
        const dirs = ['/home/user/documents', '/var/log', '/etc', '/home/user'];
        setCwd(dirs[Math.floor(Math.random() * dirs.length)]);
      }
    ];

    events[Math.floor(Math.random() * events.length)]();
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.3) {
        hauntedEvent();
      }
    }, 5000);

    const quickInterval = setInterval(() => {
      if (Math.random() < 0.05) {
        hauntedEvent();
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(quickInterval);
    };
  }, [fileSystem]);

  const resolvePath = (path: string): string => {
    if (path.startsWith('/')) {
      return path;
    }
    if (path === '..') {
      const parts = cwd.split('/').filter(p => p);
      parts.pop();
      return '/' + parts.join('/') || '/';
    }
    if (path === '.') {
      return cwd;
    }
    return cwd === '/' ? `/${path}` : `${cwd}/${path}`;
  };

  const executeCommand = (cmd: string, isGhost: boolean = false): void => {
    const parts = cmd.trim().split(/\s+/);
    const command = parts[0];
    const args = parts.slice(1);

    const output: HistoryEntry = { cmd, cwd, ghost: isGhost };

    switch (command) {
      case 'ls':
        const lsPath = args[0] ? resolvePath(args[0]) : cwd;
        const lsDir = fileSystem[lsPath];
        if (!lsDir) {
          output.result = `ls: cannot access '${args[0] || lsPath}': No such file or directory`;
        } else if (lsDir.type !== 'dir') {
          output.result = args[0] || lsPath.split('/').pop();
        } else {
          output.result = lsDir.children?.join('  ') || '';
        }
        break;

      case 'cd':
        if (!args[0]) {
          setCwd('/home/user');
          output.result = '';
        } else {
          const newPath = resolvePath(args[0]);
          const dir = fileSystem[newPath];
          if (!dir) {
            output.result = `cd: ${args[0]}: No such file or directory`;
          } else if (dir.type !== 'dir') {
            output.result = `cd: ${args[0]}: Not a directory`;
          } else {
            setCwd(newPath);
            output.result = '';
          }
        }
        break;

      case 'pwd':
        output.result = cwd;
        break;

      case 'cat':
        if (!args[0]) {
          output.result = 'cat: missing file operand';
        } else {
          const filePath = resolvePath(args[0]);
          const file = fileSystem[filePath];
          if (!file) {
            output.result = `cat: ${args[0]}: No such file or directory`;
          } else if (file.type === 'dir') {
            output.result = `cat: ${args[0]}: Is a directory`;
          } else {
            output.result = file.content;
          }
        }
        break;

      case 'clear':
        setHistory([]);
        return;

      case 'help':
        output.result = `Available commands:
  ls [path]     - List directory contents
  cd [path]     - Change directory
  pwd           - Print working directory
  cat [file]    - Display file contents
  clear         - Clear terminal
  help          - Show this help message`;
        break;

      case '':
        output.result = '';
        break;

      default:
        output.result = `${command}: command not found`;
    }

    setHistory(prev => [...prev, output]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      if (input.trim()) {
        executeCommand(input);
        setInput('');
      }
    }
  };

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div 
      className="cli-container"
      onClick={() => inputRef.current?.focus()}
    >
      {glitchText && (
        <div className="glitch-overlay">
          {glitchText}
        </div>
      )}
      
      <div className="header-text">
        Web CLI Emulator v1.0.0 - Type 'help' for available commands
      </div>
      
      <div 
        ref={terminalRef}
        className="terminal-content"
      >
        {history.map((entry, i) => (
          <div key={i}>
            {entry.ghost ? (
              <div className="ghost-message">
                {entry.result}
              </div>
            ) : (
              <>
                <div className="command-line">
                  <span className="username">user@webcli</span>
                  <span className="separator">:</span>
                  <span className="directory">{entry.cwd}</span>
                  <span className="prompt">$ </span>
                  <span className="command-text">{entry.cmd}</span>
                </div>
                {entry.result && (
                  <div className="command-output">
                    {entry.result}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      <div className="input-line">
        <span className="username">user@webcli</span>
        <span className="separator">:</span>
        <span className="directory">{cwd}</span>
        <span className="prompt">$ </span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="terminal-input"
          autoFocus
          spellCheck={false}
        />
      </div>
    </div>
  );
};

export default CLIEmulator;