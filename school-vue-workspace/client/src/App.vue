<template>
  <div id="app">
    <h1>Welcome to the School Vue Application</h1>
    <ScoreEntry />
  </div>
</template>

<script setup>
import ScoreEntry from './components/ScoreEntry.vue';
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>