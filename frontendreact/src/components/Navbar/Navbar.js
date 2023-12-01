
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import InputGroup from 'react-bootstrap/InputGroup';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import nmwdi_logo from '../../img/nmwdi_logo.png'

function AppNavbar({auth, setToken}) {

    const handleLogin = () => {

    }
    const handleLogout = () => {

        sessionStorage.removeItem('token')
        sessionStorage.removeItem('user')
        setToken(null)

    }

    let adminbutton;
    console.log('AppNavbar:', auth.user)
    if (auth.user?.is_superuser) {
        adminbutton =<Nav>
            <Nav.Link href="admin">Admin</Nav.Link>
        </Nav>
    }else{
        adminbutton = null
    }
    let loginout;

    if (auth.user){
        loginout = <Form inline="true">
            <Row>
                <Col xs="auto">
                    <Button type="submit"
                            style={{backgroundColor: "#2b2b2b",
                                margin: '0px 10px 0px 10px',
                                borderColor: "#2b2b2b"}}
                            onClick={handleLogout}>Logout</Button>
                </Col>
            </Row>
        </Form>
    }else{
        loginout = <Form inline="true">
            <Nav.Link href="login">Login</Nav.Link>
        </Form>

    }

    return (
        <Navbar style={{marginBottom: "10px", borderRadius: "10px"}}  className="fwl-navbar">

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
                    <img src={nmwdi_logo} height='60px'/>
                </Navbar.Brand>
            </Nav>
            <Container>
                <Nav>
                    <Navbar.Brand href="/">Fantasy Water League</Navbar.Brand>
                    <Nav.Link href="dashboard">Dashboard</Nav.Link>
                    <Nav.Link href="documentation">Documentation</Nav.Link>
                    <Nav.Link href="analytics">Analytics</Nav.Link>
                    <Nav.Link href="discovery">Discovery</Nav.Link>
                    <Nav.Link href="matches">Matches</Nav.Link>
                </Nav>
            </Container>

            {adminbutton}
            {loginout}


        </Navbar>
    );
}

export default AppNavbar;