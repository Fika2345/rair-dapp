import BinanceDiamond from '../images/binance-diamond.svg';
import MaticLogo from '../images/polygon-matic.svg';
import EthereumLogo from '../images/ethereum-logo.svg';

const chainData = {
	'BNB': {image: BinanceDiamond, name: 'Binance', chainId: '0x61'},
	'tMATIC': {image: MaticLogo, name: 'Matic', chainId: '0x13881'},
	'ETH': {image: EthereumLogo, name: 'Ethereum', chainId: '0x5'},
	'MATIC': {image: MaticLogo, name: 'Matic(Polygon) Mainnet', chainId: '0x137'}
}

export default chainData;