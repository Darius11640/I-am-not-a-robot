# 🤖 I'm Not a Robot Game

<p align="center">
  <a href="https://Darius11640.github.io/I-am-not-a-robot/">
    <img src="https://img.shields.io/badge/▶%20PLAY%20NOW-I%27m%20Not%20a%20Robot%20Game-2ea44f?style=for-the-badge&logo=githubpages&logoColor=white" alt="Play Now">
  </a>
</p>

A playful browser game that mimics Google's "I'm not a robot" reCAPTCHA, now with **four distinct challenge types**:

- **Classic** – Select all squares containing the target emoji.
- **Inverse** – Select all squares that do **not** contain the target.
- **Odd One Out** – Find the single square that is different.
- **Category** – Select all items belonging to a given category (animals, vehicles, etc.).

## 🚀 Live Demo

Play it here: **[I'm Not a Robot Game](https://Darius11640.github.io/I-am-not-a-robot/)**

## How to Play

1. Click the checkbox **"I'm not a robot"**.
2. A challenge appears – read the instruction carefully.
3. Click the images to select your answer(s), then press **Verify**.
4. Correct answers earn **+10 points**.
5. A wrong answer resets your score.
6. The level type changes after every success.

## Run Locally

Simply open:

```txt
index.html
```

in any modern browser – no server required.

## Deploy to GitHub Pages

The included workflow automatically deploys the site when you push to the `main` branch:

```txt
.github/workflows/deploy-pages.yml
```

You can also deploy manually from:

```txt
GitHub → Actions → Deploy GitHub Pages → Run workflow
```

## Project Structure

```txt
.
├── .github
│   └── workflows
│       └── deploy-pages.yml
├── index.html
├── script.js
├── styles.css
└── README.md
```

## Made by

**Darius11640**