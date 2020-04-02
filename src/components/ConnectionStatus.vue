<template>
  <v-tooltip bottom>
    <template v-slot:activator="{ on }">
      <v-btn
        :text="isConnected"
        :icon="isConnected"
        :color="isConnected ? '#28a745' : '#dc3545'"
        :loading="loading"
        rounded
        large
        v-on="on"
        @click="retryQuery"
        ><span v-if="!isConnected">Connection failed - Retry</span
        ><v-icon class="ok">mdi-power</v-icon></v-btn
      >
    </template>
    <span v-if="isConnected">Database Connected</span>
    <span v-else>Connection Failed</span>
  </v-tooltip>
</template>

<script>
import runQuery, { queryEvents } from "../util/dbconnection";

const testInterval = 120 * 1000;
function testConnection() {
  runQuery("MATCH (n) RETURN n LIMIT 1");
}

export default {
  name: "ConnectionStatus",
  beforeMount() {
    queryEvents.onQueryStarted = () => {
      this.loading = true;
      this.retryQuery = () => {};
    };
    queryEvents.onQuerySuccess = () => {
      this.loading = false;
      this.isConnected = true;
    };
    queryEvents.onQueryFailed = async (error, retryQuery) => {
      this.loading = false;
      this.isConnected = false;
      return new Promise((resolve) => {
        this.retryQuery = async () => {
          await retryQuery();
          resolve();
        };
      });
    };
    testConnection();
    this.timerHandle = setInterval(testConnection, testInterval);
  },
  destroyed() {
    if (this.timerHandle) {
      clearImmediate(this.timerHandle);
      this.timerHandle = null;
    }
  },
  data() {
    return {
      isConnected: true,
      loading: true,
      retryQuery: () => {},
      timerHandle: null,
    };
  },
};
</script>

<style lang="scss" scoped></style>
