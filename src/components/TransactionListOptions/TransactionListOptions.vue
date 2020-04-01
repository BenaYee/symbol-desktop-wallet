<template>
  <div class="transaction-list-options-container">
    <Select v-model="selectedOption" size="large" @input="onSelectedOptionChange">
      <Option class="select-all" :value="'all'">
        Recent
      </Option>
      <OptionGroup label="status">
        <Option :value="'confirmed'">
          Confirmed
        </Option>
        <Option :value="'unconfirmed'">
          Unconfirmed
        </Option>
        <Option :value="'partial'">
          Partial
        </Option>
      </OptionGroup>
      <OptionGroup v-if="signers.length > 0" label="Co-MultiSign">
        <Option v-for="item in signers" :key="item.publicKey" :value="item.publicKey">
          {{ item.label }}
        </Option>
      </OptionGroup>
    </Select>
  </div>
</template>

<script lang="ts">
// @ts-ignore
import { TransactionListOptionsTs } from './TransactionListOptionsTs'

export default class TransactionListOptions extends TransactionListOptionsTs { }
</script>

<style lang="less" scoped>
  @import './TransactionListOptions.less';
</style>
