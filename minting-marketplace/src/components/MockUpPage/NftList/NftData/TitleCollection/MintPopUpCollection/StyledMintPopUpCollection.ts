import styled from 'styled-components';

import { ColorChoice } from '../../../../../../ducks/colors/colorStore.types';

interface IMintPopUpCollectionContainer {
  primaryColor: ColorChoice;
}

export const MintPopUpCollectionContainer = styled.div<IMintPopUpCollectionContainer>`
  border-radius: 12px;
  height: auto;
  border: 1px solid
    ${(props) => (props.primaryColor === 'rhyno' ? '#2d2d2d' : '#fff')};
  color: #fff;

  @media screen and (max-width: 1000px) {
    overflow: auto;
    width: 90vw;

    .wrapper-collection-info.mint {
      width: 908px;
    }
  }
`;