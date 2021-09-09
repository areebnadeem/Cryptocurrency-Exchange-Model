const { assert } = require('chai')
const { default: Web3 } = require('web3')

const TokenFarm = artifacts.require('TokenFarm')
const DappToken = artifacts.require('DappToken')
const DaiToken = artifacts.require('DaiToken')

require('chai')
  .use(require('chai-as-promised'))
  .should()

function tokens(n) {
    return web3.utils.toWei(n, 'ether');
}

contract('TokenFarm', ([owner, investor ]) => {
    //write tests here
    let daiToken, dappToken, tokenFarm
    //this gets run before every test example
    before(async () => {
        daiToken = await DaiToken.new()
        dappToken = await DappToken.new()
        tokenFarm = await TokenFarm.new(dappToken.address, daiToken.address)

        //transfer all Dapp tokens to farm(1 million)

        //transfer dapp to tokenfarm
        await dappToken.transfer(tokenFarm.address, tokens('1000000'))

        //transfer dai to investor
        await daiToken.transfer(investor, tokens('100'), {from: owner})
    })

    describe('Mock DAI deployment', async()=> {
        it('has a name', async()=> {
            const name = await daiToken.name()
            assert.equal(name, 'Mock DAI Token')
        })
    })

    describe('Dapp Token Deployment', async()=> {
        it('has a name', async()=> {
            const name = await dappToken.name()
            assert.equal(name, 'DApp Token')
        })
    })


    describe('Token Farm Deployment', async()=> {
        it('has a name', async()=> {
            const name = await tokenFarm.name()
            assert.equal(name, 'Dapp Token Farm')
        })
        
        it('contract has tokens', async()=> {
            let balance = await dappToken.balanceOf(tokenFarm.address)
            assert.equal(balance.toString(), tokens('1000000'))
        })
         
    })

    describe('Farming Tokens', async()=> {
        it('rewards investors for staking mDai Tokens', async() => {
            let result

            //checking investor balance before stake
            result = await daiToken.balanceOf(investor)
            assert.equal(result.toString(), tokens('100'), 'investor balance before stake != 100 tokens')

            //approve and stake tokens
            await daiToken.approve(tokenFarm.address, tokens('100'), {from: investor})
            await tokenFarm.stakeTokens(tokens('100'), {from: investor})

            //Check staking result
            result = await daiToken.balanceOf(investor)
            assert.equal(result.toString(), tokens('0'), 'staking disapproved')

            result = await daiToken.balanceOf(tokenFarm.address)
            assert.equal(result.toString(), tokens('100'), 'Token Farm balance = 100!')

            result = await tokenFarm.isStaking(investor)
            assert.equal(result.toString(), 'true', 'investor not staking')
       

            await tokenFarm.issueTokens({from: owner})

            result = await dappToken.balanceOf(investor)
            assert.equal(result.toString(), tokens('100'), 'error')

            //make sure only owner can call issue Tokens function
            await tokenFarm.issueTokens({from: investor}).should.be.rejected;

            await tokenFarm.withdrawTokens({from: investor})

            result = await daiToken.balanceOf(investor)
            assert.equal(result.toString(), tokens('100'), 'error while unstaking')

            result = await daiToken.balanceOf(tokenFarm.address)
            assert.equal(result.toString(), tokens('0'), 'error in farm balance')

            result = await tokenFarm.stakingBalance(investor)
            assert.equal(result.toString(), tokens('0'), 'error in staking balance')

            result = await tokenFarm.isStaking(investor)
            assert.equal(result.toString(), 'false', 'error in staking status')


        })
    })





})  