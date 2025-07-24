<template>
  <div class="flex min-h-screen flex-col items-center justify-center text-center">
    <h1 class="text-6xl font-bold text-gray-800">
      404
    </h1>
    <p class="mt-4 text-xl text-muted-foreground">
      Oops! The page you're looking for doesn't exist.
    </p>
    <RouterLink to="/app/dashboard" class="mt-8 inline-block rounded-md bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90">
      Go to Dashboard
    </RouterLink>
  </div>
</template>
