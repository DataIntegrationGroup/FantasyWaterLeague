import { useFiefAuth, useFiefIsAuthenticated, useFiefUserinfo } from '@fief/fief/react';
import React, { useCallback } from 'react';
import { Link } from 'react-router-dom';

import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import InputGroup from 'react-bootstrap/InputGroup';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
// import nmwdi_logo from '../../img/nmwdi_logo.png'
import nmwdi_logo from '../../img/nmwdi_logo11-23.png'

function AppNavbar() {
    const fiefAuth = useFiefAuth();
    const isAuthenticated = useFiefIsAuthenticated();
    const userinfo = useFiefUserinfo();

    const login = useCallback(() => {
        fiefAuth.redirectToLogin(`${window.location.protocol}//${window.location.host}/callback`);
    }, [fiefAuth]);

    const logout = useCallback(() => {
        fiefAuth.logout(`${window.location.protocol}//${window.location.host}`);
    }, [fiefAuth]);

    // const handleLogin = () => {
    //
    // }
    // const handleLogout = () => {
    //
    //     sessionStorage.removeItem('token')
    //     sessionStorage.removeItem('user')
    //     setToken(null)
    //
    // }
    //
    // let adminbutton;
    // console.log('AppNavbar:', auth.user)
    // if (auth.user?.is_superuser) {
    //     adminbutton =<Nav>
    //         <Nav.Link href="admin">Admin</Nav.Link>
    //     </Nav>
    // }else{
    //     adminbutton = null
    // }
    // let loginout;
    //
    // if (auth.user){
    //     loginout = <Form inline="true">
    //         <Row>
    //             <Col xs="auto">
    //                 <Button type="submit"
    //                         style={{backgroundColor: "#2b2b2b",
    //                             margin: '0px 10px 0px 10px',
    //                             borderColor: "#2b2b2b"}}
    //                         onClick={handleLogout}>Logout</Button>
    //             </Col>
    //         </Row>
    //     </Form>
    // }else{
    //     loginout = <Nav>
    //         <Form inline="true">
    //             <Nav.Item>
    //                 <Nav.Link href="login">Login</Nav.Link>
    //             </Nav.Item>
    //         </Form>
    //     </Nav>
    //
    // }

    return (
        <Navbar>

            {/*<Container>*/}
            {/*    <Nav>*/}
            {/*        <Nav.Link href="dashboard">Dashboard</Nav.Link>*/}
            {/*        <Nav.Link href="documentation">Documentation</Nav.Link>*/}

            {/*    /!*<Navbar.Brand href="/">*!/*/}
            {/*    /!*    <img src={nmwdi_logo}/>*!/*/}
            {/*    /!*    FantasyWaterLeague</Navbar.Brand>*!/*/}
            {/*    /!*<Navbar.Collapse id="basic-navbar-nav">*!/*/}
            {/*    /!*    <Navbar.Toggle aria-controls="basic-navbar-nav" />*!/*/}
            {/*    /!*    <Nav className="me-auto">*!/*/}
            {/*    /!*        <Nav.Link href="dashboard">Dashboard</Nav.Link>*!/*/}
            {/*    /!*        <Nav.Link href="documentation">Documentation</Nav.Link>*!/*/}
            {/*    /!*        <Nav.Link href="#link">Link</Nav.Link>*!/*/}
            {/*    /!*        <NavDropdown title="Dropdown" id="basic-nav-dropdown">*!/*/}
            {/*    /!*            <NavDropdown.Item href="#action/3.1">Action</NavDropdown.Item>*!/*/}
            {/*    /!*            <NavDropdown.Item href="#action/3.2">*!/*/}
            {/*    /!*                Another action*!/*/}
            {/*    /!*            </NavDropdown.Item>*!/*/}
            {/*    /!*            <NavDropdown.Item href="#action/3.3">Something</NavDropdown.Item>*!/*/}
            {/*    /!*            <NavDropdown.Divider />*!/*/}
            {/*    /!*            <NavDropdown.Item href="#action/3.4">*!/*/}
            {/*    /!*                Separated link*!/*/}
            {/*    /!*            </NavDropdown.Item>*!/*/}
            {/*    /!*        </NavDropdown>*!/*/}
            {/*        </Nav>*/}
            {/*    /!*</Navbar.Collapse>*!/*/}
            {/*</Container>*/}
            <Nav>
                <Navbar.Brand href='https://newmexicowaterdata.org' >
                    <img src={nmwdi_logo} height='100px' style={{padding: '5px'}}/>
                </Navbar.Brand>
            </Nav>
            <Container>
                <Nav>
                    <Navbar.Brand href="/">Fantasy Water League</Navbar.Brand>
                    <Nav.Item>
                        <Nav.Link href="dashboard">Dashboard</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link href="documentation">Documentation</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link href="analytics">Analytics</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link href="discovery">Discovery</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link href="matches">Matches</Nav.Link>
                    </Nav.Item>
                </Nav>
            </Container>
            <Container style={{"justifyContent": "right"}}>
                {!isAuthenticated && <Button type="button" onClick={() => login()}>Login</Button>}
                {isAuthenticated && userinfo && (
                    <div>
                        <span style={{"padding": "10px"}}>{userinfo.email}</span>
                        <Button type="button" onClick={() => logout()}>Logout</Button>
                    </div>
                )}
            </Container>

        </Navbar>
    );
}

export default AppNavbar;