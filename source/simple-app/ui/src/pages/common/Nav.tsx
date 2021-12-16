import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alignment,
  AnchorButton,
  Classes,
  Navbar,
  NavbarGroup,
  NavbarHeading,
  NavbarDivider,
  Button,
} from '@blueprintjs/core'
import Axios from '../../js/request'
import { ProductTypes } from '../../js/types'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface NavigationProps {}

export const Navigation: React.FC<NavigationProps> = () => {
  const navigate = useNavigate()
  const [productTypeList, setProductTypeList] = useState<ProductTypes[]>([])

  const getProductType = () => {
    Axios.get('/producttypes').then((res) => {
      console.info('res:', res)
      setProductTypeList(res.data)
    })
  }

  useEffect(() => {
    getProductType()
  }, [])

  return (
    <Navbar className={Classes.DARK}>
      <NavbarGroup align={Alignment.LEFT}>
        <NavbarHeading>
          <b>LogHub Workshop</b>
        </NavbarHeading>
        <NavbarDivider />
        <Button
          onClick={() => {
            navigate('/')
          }}
          alignText={Alignment.RIGHT}
          text=""
          minimal
        >
          Home
        </Button>
        {productTypeList.map((element: ProductTypes, index) => {
          return (
            <Button
              minimal
              onClick={() => {
                window.location.href = "/type/"+element.id
                // navigate('/type/' + element.id)
              }}
              style={{ marginLeft: 10 }}
              key={index}
            >
              {element.productTypeName}
            </Button>
          )
        })}
      </NavbarGroup>
      <NavbarGroup align={Alignment.RIGHT}>
        <AnchorButton
          href="http://www.amazonaws.cn"
          text="Docs"
          target="_blank"
          minimal
          rightIcon="share"
        />
      </NavbarGroup>
    </Navbar>
  )
}
