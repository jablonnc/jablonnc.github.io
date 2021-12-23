/**
 * Layout component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.org/docs/use-static-query/
 */

 import * as React from 'react';
 import Box from '@rebass/grid';
 import Typography from '@mui/material/Typography';
 import styled from 'styled-components';

 const Header = styled(Box)`
    background: red;
 `
 
 export default function AccountMenu({
     children
 }) {
   const [anchorEl, setAnchorEl] = React.useState(null);
   const open = Boolean(anchorEl);
   
   const handleClick = (event) => {
     setAnchorEl(event.currentTarget);
   };
   const handleClose = () => {
     setAnchorEl(null);
   };

   return (
    <React.Fragment>
        <Header sx={{ display: 'flex', alignItems: 'right', justifyContent: 'right' }}>
            <Typography sx={{ minWidth: 100 }}>Contact</Typography>
            <Typography sx={{ minWidth: 100 }}>Profile</Typography>
        </Header>

        <>
            {children}
        </>
    </React.Fragment>
   );
 }
