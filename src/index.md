---
layout: base.njk
title: Home
permalink: /
hook: You are never as alone as you think.
intro: >
  I'm a retired physicist living in Santa Barbara. Sleep in Heavenly Peace is
  my first novel — a philosophical mystery about memory, perception, and how
  much of what we call reality we actually control.
---

<div class="hero">
  <h1 class="display">{{ site.author }}</h1>
  <p class="tagline">{{ site.tagline }}</p>
  <p class="lead centered">{{ intro }}</p>

  <img class="hero-cover" src="/assets/cover-with-background.jpg"
       alt="{{ site.bookTitle }} — book cover" />

  <p class="pull">{{ hook }}</p>

  <p class="centered">
    <a class="btn" href="/book/">Read about the book</a>
  </p>
</div>
