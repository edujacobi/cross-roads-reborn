<script setup lang="ts">
import { Coins, AlertTriangle } from "lucide-vue-next";
import BaseButton from "~/components/ui/BaseButton.vue";

definePageMeta({
  layout: false,
});

const route = useRoute();
const auth = useAuth();

const errorMessage = computed(() => {
  if (route.query.error) {
    return decodeURIComponent(String(route.query.error));
  }
  return null;
});

onMounted(() => {
  auth.initAuth();
  if (auth.isAuthenticated.value) {
    navigateTo("/");
  }
});
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <div class="brand-logo">
        <Coins :size="36" />
      </div>

      <h1 class="title">CROSS ROADS REBORN</h1>
      <p class="subtitle">Painel de Controle Administrativo</p>

      <div v-if="errorMessage" class="error-banner">
        <AlertTriangle :size="18" />
        <span>{{ errorMessage }}</span>
      </div>

      <div class="info-box">
        <p>Acesso estritamente restrito a membros com badge de <strong>Developer</strong> ou <strong>Moderator</strong>.</p>
      </div>

      <BaseButton
        variant="primary"
        size="lg"
        class="discord-login-btn"
        @click="auth.loginWithDiscord()"
      >
        <svg
          class="discord-icon"
          viewBox="0 0 24 24"
          fill="currentColor"
          width="20"
          height="20"
        >
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
        </svg>
        <span>Entrar com Discord</span>
      </BaseButton>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.login-container {
  @include flex-center;
  min-height: 100vh;
  background: radial-gradient(circle at center, #171b26 0%, $bg-main 70%);
  padding: 24px;
}

.login-card {
  width: 100%;
  max-width: 440px;
  @include card-surface;
  background-color: $bg-card;
  padding: 40px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  box-shadow: $shadow-lg;

  .brand-logo {
    @include flex-center;
    width: 68px;
    height: 68px;
    background-color: rgba($color-brand, 0.15);
    border: 1px solid rgba($color-brand, 0.4);
    border-radius: $radius-md;
    color: $color-brand;
    margin-bottom: 20px;
  }

  .title {
    font-size: 1.375rem;
    font-weight: 800;
    letter-spacing: 0.05em;
    color: $text-primary;
  }

  .subtitle {
    font-size: 0.875rem;
    color: $text-secondary;
    margin-top: 6px;
    margin-bottom: 24px;
  }

  .error-banner {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    background-color: rgba($color-danger, 0.15);
    border: 1px solid rgba($color-danger, 0.4);
    border-radius: $radius-sm;
    color: lighten($color-danger, 15%);
    font-size: 0.8125rem;
    text-align: left;
    margin-bottom: 20px;
  }

  .info-box {
    width: 100%;
    padding: 14px 16px;
    background-color: rgba($bg-input, 0.6);
    border: 1px solid $border-subtle;
    border-radius: $radius-sm;
    font-size: 0.8125rem;
    color: $text-muted;
    margin-bottom: 28px;
    line-height: 1.5;

    strong {
      color: $text-primary;
    }
  }

  .discord-login-btn {
    width: 100%;
    background-color: #5865f2;
    color: #fff;
    border-color: #4752c4;

    &:hover {
      background-color: lighten(#5865f2, 5%);
    }

    .discord-icon {
      fill: currentColor;
    }
  }
}
</style>
