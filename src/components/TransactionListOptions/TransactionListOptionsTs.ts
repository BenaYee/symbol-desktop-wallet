/**
 * Copyright 2020 NEM Foundation (https://nem.io)
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
// external dependencies
import {mapGetters} from 'vuex'
import {Component, Vue, Watch} from 'vue-property-decorator'
import { NetworkType, Address} from 'symbol-sdk'

// internal dependencies
import {WalletsModel} from '@/core/database/entities/WalletsModel'

// child components
// @ts-ignore
import SignerSelector from '@/components/SignerSelector/SignerSelector.vue'
import {RESTDispatcher} from '@/core/utils/RESTDispatcher'
import {MultisigService} from '@/services/MultisigService'


@Component({
  components: {SignerSelector},
  computed: {
    ...mapGetters({
      currentWallet: 'wallet/currentWallet',
      networkType: 'network/networkType',
    }),
  },
})
export class TransactionListOptionsTs extends Vue {

  /**
   * Currently active wallet
   * @var {WalletsModel}
   */
  protected currentWallet: WalletsModel


  /**
 * Network type
 * @var {NetworkType}
 */
  protected networkType: NetworkType

  /**
   * Selected signer from the store
   * @protected
   * @type {string}
   */
  protected selectedSigner: string = this.$store.getters['wallet/currentWallet'].values.get('publicKey')

  /** 
   * set the default to select all
   */
  protected selectedOption: string='all'
  /**
   * Whether to show the signer selector
   * @protected
   * @type {boolean}
   */
  protected showSignerSelector: boolean = false

  /**
   * Hook called when the signer selector has changed
   * @protected
   */
  protected onSignerSelectorChange(publicKey: string): void {
  
    // set selected signer if the chosen account is a multisig one
    const isCosig = this.currentWallet.values.get('publicKey') !== publicKey
    const payload = !isCosig ? this.currentWallet : {
      networkType: this.networkType,
      publicKey: publicKey,
    }

    // clear previous account transactions
    this.$store.dispatch('wallet/RESET_TRANSACTIONS') 

    // dispatch actions using the rest dispatcher
    const dispatcher = new RESTDispatcher(this.$store.dispatch)
    dispatcher.add('wallet/SET_CURRENT_SIGNER', {model: payload})
    const action: string = 'wallet/GET_ALL_TRANSACTIONS' 
    dispatcher.add(action, {
      group: 'all',
      address: Address.createFromPublicKey(publicKey, this.networkType).plain(),
      pageSize: 100,
    })

    dispatcher.throttle_dispatch()
    
  }
  protected onSelectedOptionChange(){
    // clear previous account transactions
    this.$store.dispatch('wallet/RESET_TRANSACTIONS')
    this.$store.commit('wallet/isCosignatoryMode',false)
    this.$emit('option-change',this.selectedOption)
    if([ 'all','confirmed','unconfirmed','partial' ].indexOf(this.selectedOption) < 0){
      this.onSignerSelectorChange(this.selectedOption)
    }
  }

  /**
   * Addresses to be shown in the selector
   * @TODO: Not DRY since the same function is in FormTransactionBase
   * @readonly
   * @type {{publicKey: string, label: string}[]}
   */
  protected get signers(): {publicKey: string, label: string}[] {
    const _signers = new MultisigService(this.$store, this.$i18n).getSigners()
    return _signers.filter((signer)=>{
      return signer.publicKey != this.currentWallet.values.get('publicKey')
    })
  }

  /**
   * Watch for currentWallet changes
   * Necessary to set the default signer in the selector and set the default  option
   * @param {*} newCurrentWallet
   */
  @Watch('currentWallet')
  onCurrentWalletChange(newCurrentWallet: WalletsModel): void {
    this.selectedOption = 'all'
    this.$parent['selectedOption'] = 'all'
    this.selectedSigner = newCurrentWallet.values.get('publicKey')
  }

  /**
   * Hook called before the component is destroyed
   */
  beforeDestroy(): void {
    // reset the selected signer if it is not the current wallet
    this.onSignerSelectorChange(this.currentWallet.values.get('publicKey'))
  }
}
