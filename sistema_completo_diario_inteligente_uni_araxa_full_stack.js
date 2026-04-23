// ===============================
// BACKEND COMPLETO (Node.js + Express + JWT + OpenAI)
// ===============================

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ====== LOGIN ======
app.post("/login", (req, res) => {
  const { email, senha } = req.body;

  if (email === "professor@uniaraxa.edu.br" && senha === "123456") {
    const token = jwt.sign({ id: 1, nome: "Professor" }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    return res.json({ token });
  }

  res.status(401).json({ error: "Credenciais inválidas" });
});

// ====== MIDDLEWARE ======
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Sem token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Token inválido" });
  }
};

// ====== IA ======
app.post("/gerar-diario", auth, async (req, res) => {
  const { texto } = req.body;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Transforme a fala do professor em diário de aula com Faltas, Conteúdo e Observações.",
        },
        { role: "user", content: texto },
      ],
    }),
  });

  const data = await response.json();
  const resultado = data.choices[0].message.content;

  res.json({ resultado });
});

const PORT = 3001;
app.listen(PORT, () => console.log("Backend rodando"));

// ===============================
// FRONTEND COMPLETO (React)
// ===============================

import { useState } from "react";

export default function App() {
  const [texto, setTexto] = useState("");
  const [resultado, setResultado] = useState("");
  const [token, setToken] = useState(localStorage.getItem("token"));

  const login = async () => {
    const res = await fetch("http://localhost:3001/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "professor@uniaraxa.edu.br", senha: "123456" }),
    });

    const data = await res.json();
    localStorage.setItem("token", data.token);
    setToken(data.token);
  };

  const gerar = async () => {
    const res = await fetch("http://localhost:3001/gerar-diario", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ texto }),
    });

    const data = await res.json();
    setResultado(data.resultado);
  };

  const voz = () => {
    const rec = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    rec.lang = "pt-BR";
    rec.onresult = (e) => setTexto(e.results[0][0].transcript);
    rec.start();
  };

  if (!token) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Login Professor</h2>
        <button onClick={login}>Entrar</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>UniAraxá - Diário Inteligente</h1>

      <textarea value={texto} onChange={(e) => setTexto(e.target.value)} />

      <br />
      <button onClick={voz}>🎤 Falar</button>
      <button onClick={gerar}>Gerar</button>

      <pre>{resultado}</pre>
    </div>
  );
}

// ===============================
// INSTRUÇÕES FINAIS
// ===============================

/*
1. Criar .env
OPENAI_API_KEY= SUA_CHAVE
JWT_SECRET= segredo

2. Rodar backend:
node index.js

3. Rodar frontend:
npm start

4. Deploy:
Backend → Render
Frontend → Vercel

5. Pronto: sistema institucional funcionando
*/
