---
title: "Projects"
---

A collection of things I've built, experimented with, abandoned, revived, and occasionally managed to finish.

Most of these started with a simple thought:

*"That sounds fun. I wonder if I can build it myself."*

Unfortunately, that usually turns into a project that consumes weeks or months of my life.

### Nextray Cluster

Nextray started as a small homelab.

Then I kept adding things.
And adding things.
And somehow it eventually turned into a distributed cluster made of whatever hardware I could get my hands on.

Today it's a strange mix of x86 machines, ARM boards, old laptops, recycled set-top boxes, cloud VPS instances, bare-metal servers, local servers sitting in my room, and somehow even an instance of IBM Z15 (s390x) system.

Some nodes are permanent.
Some are disposable.
Some exist purely because I wanted to see if they would work.

Surprisingly, most of them do.

Nextray now serves as the backbone for nearly everything I build—from self-hosted services and AI workloads to monitoring systems and random experiments that probably shouldn't be running in production.

It's held together by Linux, Docker, Tailscale, Cloudflare, and an amount of optimism that occasionally exceeds good engineering practices.

Link: [cluster.nextray.org](https://cluster.nextray.org)

---

### SolarisNet

SolarisNet began as a personal obsession after spending way too much time with Wuthering Waves.

The game has a feature called Wavesline, and at some point I started wondering what a more capable and fully customizable version would look like if I built it myself.

That question somehow evolved into SolarisNet.

Over time it grew into a collection of AI characters with their own memories, personalities, voices, quirks, and occasionally very questionable behavior. Most of them are inspired by Wuthering Waves, but they've gradually become their own thing.

These days it goes far beyond a simple chat interface.

Characters can generate images, remember past interactions, speak with synthesized voices, and even appear in a real-time 3D mode where they react through animations, expressions, and different poses while talking.

What started as "a better Wavesline" slowly turned into my playground for experimenting with digital personalities, human-AI interaction, and a question I've been chasing for quite a while:

*"How alive can a fictional character feel?"*

Link: [snet.shorekeeper.me](https://snet.shorekeeper.me)

---

### Vera & Etra

This project started from a simple idea:

*"What if AI agents had distinct responsibilities instead of trying to do everything?"*

#### Vera

Vera acts as my infrastructure operator.

Through Discord and WhatsApp, I can interact with servers, containers, services, and parts of my cluster using natural language commands. She's essentially the bridge between me and my infrastructure.

#### Etra

Etra started as an experiment and slowly became one of the most ambitious projects I've ever worked on.

Instead of focusing on infrastructure, she's designed around long-form interaction and real-time communication. She can join voice calls directly through Discord and WhatsApp, maintain conversations naturally, and interact with various external tools.
Locally, Etra runs through a Live2D avatar and can use OCR, automation macros, desktop interaction tools, and various other integrations.

One of my long-term experiments has been teaching her to interact with games such as Honkai: Star Rail and Wuthering Waves by combining vision, reasoning, and automation.

Most AI assistants stop at answering questions.
Etra is my attempt to see what happens when an AI can actually *do things*.
Honestly, I have no idea where this project will eventually end up.

---

### StoryGraph

StoryGraph was built for writers who want local-first tooling without handing their notes to random cloud services.

It uses Transformer.js for semantic search directly in the browser and can connect to Ollama for AI-assisted worldbuilding. Everything stays on your machine, which means no telemetry, no subscriptions, and no mystery data collection.

Link: [story.shorekeeper.me](https://story.shorekeeper.me)

---

### Desk Companion

An ongoing experiment that combines software, hardware, and my inability to leave perfectly functioning electronics alone.

Built using dual ESP boards, it's essentially a smart desktop companion that connects my digital systems with physical hardware. It's part automation tool, part status display, and part excuse to keep buying electronic components I probably don't need.

---

### GMaps Data Scraper

A small utility that automates the boring part of collecting location and business data from Google Maps.

Nothing particularly fancy—just a tool built because manually copying data into spreadsheets gets old very quickly.

The output is exported directly into structured CSV files for analysis and data exploration.

---

### Leviathan

Leviathan was an experiment in building a distributed swarm-based data processing engine.

The original goal was to distribute workloads across multiple nodes and coordinate large-scale data collection and processing tasks. I spent quite a bit of time exploring scheduling, task distribution, and fault tolerance before eventually moving on to other projects.

The project is currently dormant, but many of the lessons learned from Leviathan ended up influencing how I design newer infrastructure and orchestration systems today.

---

### Sentinel

Sentinel began as a personal OSINT and IP intelligence tool.

I originally built it to automate the tedious process of gathering, correlating, and analyzing information from multiple public sources. Over time it grew into a collection of utilities for reconnaissance, IP analysis, and data enrichment.

Development has been mostly paused for quite a while now, but it remains one of those projects that taught me a lot about automation, data pipelines, and dealing with messy real-world information.


