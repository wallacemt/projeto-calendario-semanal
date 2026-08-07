<script setup lang="ts">
import { onMounted } from 'vue'
import AppShell from '../../../components/AppShell.vue'
import ConnectedAccounts from '../components/ConnectedAccounts.vue'
import DangerZone from '../components/DangerZone.vue'
import ProfileCard from '../components/ProfileCard.vue'
import ProfileInfo from '../components/ProfileInfo.vue'
import ProfileSkeleton from '../components/ProfileSkeleton.vue'
import ProfileStats from '../components/ProfileStats.vue'
import { useProfileStore } from '../store'

const store = useProfileStore()
onMounted(() => store.fetch())
</script>

<template>
  <AppShell title="Meu perfil" subtitle="Gerencie suas informações e conta">
    <div v-if="store.profile" class="flex flex-col gap-6 p-8 lg:flex-row">
      <div class="flex w-full flex-col gap-5 lg:w-95 lg:flex-shrink-0">
        <ProfileCard :profile="store.profile" />
        <ConnectedAccounts :profile="store.profile" />
        <DangerZone />
      </div>

      <div class="flex flex-1 flex-col gap-5">
        <ProfileInfo :profile="store.profile" />
        <ProfileStats :profile="store.profile" />
      </div>
    </div>
    <ProfileSkeleton v-else-if="store.loading" />
  </AppShell>
</template>
