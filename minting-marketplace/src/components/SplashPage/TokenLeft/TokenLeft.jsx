import React, { useEffect, useState } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
// import { useHistory } from 'react-router';
import MailchimpComponent from '../NipseyRelease/MailchimpComponent';

const TokenLeft = ({ primaryColor, DiscordIcon, copies, soldCopies }) => {
    const [percentTokens, setPersentTokens] = useState(0);
    // const history = useHistory();
    // const [emailField, setEmailField] = useState('');

    // const onChangeEmail = (e) => {
    //     setEmailField(e.target.value);
    // }

    // const onSubmit = (e) => {
    //     setTimeout(() => {
    //         if (emailField === "") {
    //             alert('Filling the field!')
    //         } else {
    //             e.preventDefault();
    //             history.push('/thankyou');
    //         }
    //     }, 1000)
    // }

    const leftTokensNumber = Number(copies) - Number(soldCopies);
    const wholeTokens = Number(copies);

    useEffect(() => {
        if (leftTokensNumber <= wholeTokens) {
            const percentLeft = (leftTokensNumber * 100) / wholeTokens;
            if (percentLeft > 1) {
                setPersentTokens(Math.floor(percentLeft));

            }
            else if (percentLeft > 990) {
                setPersentTokens(Math.floor(percentLeft));
            }
            else {
                setPersentTokens(Math.ceil(percentLeft));
                console.log(percentLeft)
            }
        }
        if (leftTokensNumber > wholeTokens) {
            setPersentTokens(100)
        }
    }, [setPersentTokens, leftTokensNumber, wholeTokens])

    return (
        <div className="left-tokens">
            <div className="block-left-tokens">
                <div
                    className="progress-tokens"
                    style={{ background: `${primaryColor === "rhyno" ? "rgba(34, 32, 33, 0.4)" : "rgba(34, 32, 33, 0.6)"}` }}
                >
                    <div className="title-progress-left">
                        NFTs remaining
                    </div>
                    <Box className="box-progress" sx={{ position: 'relative' }}>
                        <CircularProgress
                            className="progress-grey"
                            variant="determinate"
                            sx={{
                                color: (theme) =>
                                    theme.palette.grey[theme.palette.mode === 'light' ? 200 : 800],
                            }}
                            size={40}
                            thickness={1.5}
                            value={100}
                        />
                        <CircularProgress
                            className="progress-main"
                            variant="determinate"

                            sx={{
                                color: (theme) => (theme.palette.mode === 'light' ? '#1a90ff' : '#308fe8'),
                                position: 'absolute',
                                left: 0,
                            }}
                            size={40}
                            thickness={4}
                            value={percentTokens}
                        />
                    </Box>
                    <div
                        className="text-progress"
                        style={{ fontSize: `${leftTokensNumber === 1000 && "32px"}` }}
                    >
                        <div className="progress-info">
                            <div className="text-numbers">
                                <div className="text-left-tokens text-gradient">{leftTokensNumber} </div>
                                <div className="text-whole-tokens"> / {wholeTokens}</div>
                            </div>
                            <div>left</div>
                        </div>
                    </div>
                </div>
                <div className="down-text">
                    Minting on demand secures your NFT on the blockhain.Unique<br />
                    artwork to follow based on examples shown.
                </div>
            </div>
            <div className="left-tokens-content">
                <div className="title-tokens">
                    <h3>The <span className="text-gradient">Nipsey Hussle</span> legacy</h3>
                </div>
                <div className="tokens-description">
                    <p style={{ color: `${primaryColor === "rhyno" ? "#000" : "#A7A6A6"}` }}>
                        October 2013, Los Angeles, CA. Nipsey unveils the Crenshaw EP with a
                        groundbreaking release strategy: Sell 1000 copies for $100 each.
                    </p>

                    <p style={{ color: `${primaryColor === "rhyno" ? "#000" : "#A7A6A6"}` }}>
                        Within 24 hours, all 1000 copies are spoken for.
                    </p>

                    <p style={{ color: `${primaryColor === "rhyno" ? "#000" : "#A7A6A6"}` }}>
                        In collaboration with award-winning producer Mr. Lee, the Asghedom estate,
                        Southwest Digital Distribution, and RAIR Technologies , the final Nipsey
                        experience is released as an exclusive 1000 run streaming NFT.
                    </p>
                </div>
                <div className="release-join-discord">
                    <MailchimpComponent />
                    <div className="btn-discord">
                        <a href="https://discord.gg/NFeGnPkbfd" target="_blank" rel="noreferrer"><img src={DiscordIcon} alt="discord icon" /> Join our Discord</a>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TokenLeft