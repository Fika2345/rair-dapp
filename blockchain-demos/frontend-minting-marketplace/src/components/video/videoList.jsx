import { useEffect, useState } from 'react';
import VideoItem from './videoItem.jsx';
import InputField from '../common/InputField.jsx';

const VideoList = props => {
	const [mediaList, setMediaList] = useState();
	const [titleSearch, setTitleSearch] = useState('');
	const updateList = async () => {
		let response = await (await fetch('/api/media/list', {
			headers: {
				'x-rair-token': localStorage.token
			}
		})).json()
		if (response.success) {
			setMediaList(response.list)
		} else if (response?.message === 'jwt expired' || response?.message === 'jwt malformed') {
			localStorage.removeItem('token');
		} else {
			console.log(response?.message);
		}
	}

	useEffect(() => {
		if (localStorage.token) {
			updateList();
		}
	}, [])

	return <>
		<details className='col-12'>
			<summary> Search </summary>
			<InputField
				getter={titleSearch}
				setter={setTitleSearch}
				customClass='form-control' />
		</details>
		{mediaList ? Object.keys(mediaList).filter(item => mediaList[item].title.toLowerCase().includes(titleSearch.toLowerCase())).map((item, index) => {
			return <VideoItem key={index} mediaList={mediaList} item={item} />
		}) : 'Searching...'}
	</>
};

export default VideoList;