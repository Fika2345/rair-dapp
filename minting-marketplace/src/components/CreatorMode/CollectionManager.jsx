import { useState, useEffect, useCallback } from 'react'
import Swal from 'sweetalert2';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import CustomPayRate from '../whitelabel/customizePayRate.jsx';
import { utils } from 'ethers';

// const LockManager = ({ index, array, deleter, disabled, locker, productIndex }) => {

// 	const [start, setStart] = useState(array[index].startingToken);
// 	const [end, setEnd] = useState(array[index].endingToken);
// 	const [locked, setLocked] = useState(array[index].countToUnlock);

// 	return <tr>
// 		<th>
// 			{!disabled ? <button
// 				onClick={e => deleter(index)}
// 				className='btn btn-danger h-50'>
// 				<i className='fas fa-trash' />
// 			</button> : ''}
// 		</th>
// 		<th>
// 			#{index + 1}
// 		</th>
// 		<th>
// 			<input className='form-control' type='number' disabled={disabled} value={start} onChange={e => setStart(e.target.value)} />
// 		</th>
// 		<th>
// 			<input className='form-control' type='number' disabled={disabled} value={end} onChange={e => setEnd(e.target.value)} />
// 		</th>
// 		<th>
// 			<input className='form-control' type='number' disabled={disabled} value={locked} onChange={e => setLocked(e.target.value)} />
// 		</th>
// 		<th>
// 			{!disabled ? <button
// 				onClick={e => locker(productIndex, start, end, locked)}
// 				className='btn btn-success h-50'>
// 				<i className='fas fa-lock' />
// 			</button> : ''}
// 		</th>
// 	</tr>
// }

const RangeManager = ({ disabled, index, array, deleter, sync, hardLimit, locker, productIndex, updater, offerIndex }) => {

	const [endingRange, setEndingRange] = useState(disabled ? array[index].endingToken : (index === 0) ? 0 : (Number(array[index - 1].endingToken) + 1));
	const [rangeName, setRangeName] = useState(array[index].name);
	const [rangePrice, setRangePrice] = useState(array[index].price);
	const syncOutside = useCallback(sync, [sync]);
	const rangeInit = ((index === 0) ? 0 : (Number(array[index - 1].endingToken) + 1));
	const [locked, setLocked] = useState(0);

	useEffect(() => {
		let aux = array[index].endingToken !== endingRange;
		array[index].endingToken = endingRange;
		if (aux) {
			syncOutside();
		}
	}, [endingRange, array, index, syncOutside])

	useEffect(() => {
		let aux = array[index].name !== rangeName;
		array[index].name = rangeName;
		if (aux) {
			syncOutside();
		}
	}, [rangeName, array, index, syncOutside])

	useEffect(() => {
		let aux = array[index].price !== rangePrice;
		array[index].price = rangePrice;
		if (aux) {
			syncOutside();
		}
	}, [rangePrice, array, index, syncOutside])

	let prevLastIndex = (index === 0) ? 0 : (Number(array[index - 1].endingToken + 1));

	return <>
	<tr>
		<th>
			{!disabled ? <button
				onClick={e => deleter(index)}
				className='btn btn-danger h-50'>
				<i className='fas fa-trash' />
			</button> : ''}
		</th>
		<th>
			#{index + 1}
		</th>
		<th>
			<input className='form-control' value={rangeName} onChange={e => setRangeName(e.target.value)} />
		</th>
		<th>
			<input className='form-control' type='number' value={prevLastIndex} disabled />
		</th>
		<th>
			<input
				style={((index === 0 ? 0 : array[index - 1].endingToken) > endingRange) || endingRange > hardLimit ? {
					backgroundColor: 'red',
					color: 'white'
				} : {}}
				disabled={disabled}
				className='form-control'
				type='number'
				min={(index === 0) ? 0 : (Number(array[index - 1].endingToken) + 1)}
				max={hardLimit}
				value={endingRange}
				onChange={e => setEndingRange(Number(e.target.value))} />
		</th>
		<th>
			<input type='number' className='form-control' value={rangePrice} onChange={e => setRangePrice(e.target.value)} />
		</th>
		<th>
			<button
				disabled={!disabled || !rangePrice || !rangeName}
				onClick={e => updater(offerIndex,index,prevLastIndex,endingRange,rangePrice,rangeName)}
				className='btn btn-stimorol h-50'>
				<i className='fas fa-arrow-up' />
			</button>
		</th>
		<th>
			<input className='form-control' type='number' value={locked} onChange={e => setLocked(e.target.value)} />
		</th>
		<th>
			<button
				disabled={locked <= 0}
				onClick={e => locker(productIndex, rangeInit, endingRange, locked)}
				className='btn btn-royal-ice h-50'>
				<i className='fas fa-lock' />
			</button>
		</th>
	</tr>
	<tr>
		<th />
		<th />
		<th />
		<th />
		<th />
		<th>
			<small>{utils.formatEther(rangePrice === '' ? 0 : rangePrice).toString()} {'ETH'}</small>
		</th>
		<th />
		<th />
	</tr>
	</>
}

const ProductManager = ({ productIndex, productInfo, tokenInstance, tokenAddress }) => {

	const { minterInstance } = useSelector(state => state.contractStore);

	const [ranges, setRanges] = useState([]);
	const [/*locks*/, setLocks] = useState([]);
	const [forceSync, setForceSync] = useState(false);
	const [offerIndex, setOfferIndex] = useState();

	const deleter = index => {
		let aux = [...ranges];
		aux.splice(index, 1);
		setRanges(aux);
	}

	/*const lockDeleter = index => {
		let aux = [...locks];
		aux.splice(index, 1);
		setLocks(aux);
	}*/

	const locker = async (productIndex, startingToken, endingToken, lockedTokens) => {
		try {
			await tokenInstance.createRangeLock(productIndex, startingToken, endingToken, lockedTokens);
		} catch (err) {
			Swal.fire('Error', err?.data?.message, 'error');
		}
	}

	const refresher = useCallback(async () => {
		try {
			// Marketplace Ranges
			let offerIndex = (await minterInstance.contractToOfferRange(tokenInstance.address, productIndex)).toString();
			if (offerIndex) {
				setOfferIndex(offerIndex);
			}
			let offerData = await minterInstance.getOfferInfo(offerIndex);
			let existingRanges = [];
			for await (let rangeIndex of [...Array.apply(null, { length: offerData.availableRanges.toString() }).keys()]) {
				let rangeInfo = await minterInstance.getOfferRangeInfo(offerIndex, rangeIndex);
				if (Number(rangeInfo.collectionIndex.toString()) === productIndex) {
					existingRanges.push({
						offerIndex,
						endingToken: Number(rangeInfo.tokenEnd.toString()),
						name: rangeInfo.name,
						price: rangeInfo.price.toString(),
						disabled: true,
					})
				}
			}
			setRanges(existingRanges);

		} catch (err) {
			console.error(err);
		}

		try {// Lock Ranges
			let existingLocks = [];
			for await (let lockIndex of productInfo.locks) {
				let lockInfo = await tokenInstance.getLockedRange(lockIndex);
				if (Number(lockInfo.productIndex.toString()) === productIndex) {
					existingLocks.push({
						startingToken: lockInfo.startingToken.toString(),
						endingToken: lockInfo.endingToken.toString(),
						countToUnlock: lockInfo.countToUnlock.toString(),
						disabled: true
					})
				}
			}
			setLocks(existingLocks);
		} catch (err) {
			console.error(err?.data?.message);
		}
	}, [minterInstance, productIndex, productInfo.locks, tokenInstance])

	const notDisabled = (item) => {
		return !item.disabled;
	}

	const updater = async (offerIndex, rangeIndex, startToken, endToken, price, name) => {
		if (!offerIndex || !rangeIndex === undefined || startToken === undefined || !endToken || !price || !name) {
			console.error('Update Rejected');
			return;
		}
		Swal.fire({title: 'Updating', html: 'Please wait', icon: 'info', showConfirmButton: false});
		try {
			await minterInstance.updateOfferRange(offerIndex, rangeIndex, startToken, endToken, price, name);
		} catch (e) {
			Swal.fire('Error',e?.message?.toString(),'error');
			return;
		}
		Swal.fire({title: 'Success', html: 'Please wait', icon: 'info', showConfirmButton: false});
	} 

	useEffect(() => {
		if (minterInstance) {
			minterInstance.on('AppendedRange(address,uint256,uint256,uint256,uint256,uint256,uint256,string)', function () {
				refresher()
			})
		}
	},[]);

	useEffect(() => {
		if (tokenInstance && minterInstance) {
			refresher()
		}
	}, [productInfo, tokenInstance, minterInstance, refresher])
	return <details style={{position: 'relative'}} className='w-100 border border-secondary rounded'>
		<Link
			className='btn btn-warning'
			id={`metadata_${productIndex + 1}`}
			style={{position: 'absolute', top: 0, right: 0}}
			to={`/metadata/${tokenInstance.address}/${productIndex}`}>
			Edit Metadata!
		</Link>
		<summary>
			Product #{productIndex + 1}: {productInfo.name}
		</summary>
		{offerIndex && <CustomPayRate
			address={tokenInstance.address}
			blockchain={window.ethereum.chainId}
			catalogIndex={offerIndex}
			customStyle={{position: 'absolute', top: 0, left: 0}}
		/>}
		<div className='row mx-0 px-0'>
			<div className='col-12'>
				<h5> Product Info </h5>
				First token: {productInfo.startingToken}<br />
				Last Token: {productInfo.endingToken}<br />
				Mintable Tokens Left: {productInfo.mintableTokensLeft}<br />
			</div>
			<hr className='w-100' />
			<div className='col-12' style={{ position: 'relative' }}>
				<button
					style={{ position: 'absolute', right: 0, top: 0 }}
					onClick={e => {
						let aux = [...ranges];
						aux.push({
							endingToken: aux.length === 0 ? 0 : (Number(aux[aux.length - 1].endingToken) + 1),
							name: '',
							price: 0
						});
						setRanges(aux);
					}}
					className='btn btn-royal-ice'>
					<i className='fas fa-plus' />
				</button>
				<h5> On the Minter Marketplace </h5>
				<table className='w-100'>
					<thead>
						<tr>
							<th />
							<th> #  </th>
							<th>
								Name
							</th>
							<th>
								Starts
							</th>
							<th>
								Ends
							</th>
							<th>
								Price for each
							</th>
							<th>
							</th>
							<th>
								Locked Tokens
							</th>
						</tr>
					</thead>
					<tbody>
						{ranges.map((item, index, array) => {
							console.log(item);
							return <RangeManager
								key={index}
								disabled={item.disabled}
								offerIndex={item.offerIndex}
								updater={updater}
								index={index}
								array={array}
								deleter={deleter}
								sync={() => { setForceSync(!forceSync) }}
								hardLimit={productInfo.endingToken - productInfo.startingToken}
								locker={locker}
								productIndex={productIndex}
							/>
						})}
					</tbody>
				</table>
				<button onClick={async e => {
					try {
						if (ranges.length > 0 && ranges[0].disabled) {
							await minterInstance.appendOfferRangeBatch(
								await minterInstance.contractToOfferRange(tokenInstance.address, productIndex),
								ranges.filter(notDisabled).map((item, index, array) => {
									if (index === 0) {
										let i = 0;
										for (; i < ranges.length; i++) {
											if (!ranges[i].disabled) {
												return ranges[i - 1].endingToken + 1;
											}
										}
									}
									return (Number(array[index - 1].endingToken) + 1)
								}),
								ranges.filter(notDisabled).map((item) => item.endingToken),
								ranges.filter(notDisabled).map((item) => item.price),
								ranges.filter(notDisabled).map((item) => item.name)
							)
						} else {
							await minterInstance.addOffer(
								tokenAddress,
								productIndex,
								ranges.map((item, index, array) => (index === 0) ? 0 : (Number(array[index - 1].endingToken) + 1)),
								ranges.map((item) => item.endingToken),
								ranges.map((item) => item.price),
								ranges.map((item) => item.name),
								'0x3fD4268B03cce553f180E77dfC14fde00271F9B7');
						}
					} catch (err) {
						console.error(err);
						Swal.fire('Error', err?.data?.message, 'error');
					}
				}} disabled={!ranges.filter(item => !item.disabled).length} className='btn btn-warning'>
					{ranges.length > 0 && ranges[0].disabled ? `Append ${ranges.filter(item => !item.disabled).length} ranges to the marketplace` : `Create offer with ${ranges.length} ranges on the marketplace`}
				</button>
			</div>
			{/* <div className='col-6' style={{position: 'relative'}}>
				<button
					style={{position: 'absolute', right: 0, top: 0}}
					onClick={e => {
						let aux = [...locks];
						aux.push({
							startingToken: 0,
							endingToken: 0,
							countToUnlock: 0,
							disabled: false
						});
						setLocks(aux);
					}}
					className='btn btn-success'>
					<i className='fas fa-plus' />
				</button>
				<h5> Resale Locks </h5>
				<table className='w-100'>
					<thead>
						<tr>
							<th />
							<th> # </th>
							<th>
								Starts
							</th>
							<th>
								Ends
							</th>
							<th>
								Locked Tokens
							</th>
						</tr>
					</thead>
					<tbody>
						{locks.map((item, index, array) => {
							return <LockManager
										key={index}
										locker={locker}
										productIndex={productIndex}
										disabled={item.disabled}
										index={index}
										array={array}
										deleter={lockDeleter}
										sync={() => {setForceSync(!forceSync)}}
										hardLimit={productInfo.endingToken - productInfo.startingToken}
									/>
						})}
					</tbody>
				</table>
			</div> */}
		</div>
	</details>
}

export default ProductManager;