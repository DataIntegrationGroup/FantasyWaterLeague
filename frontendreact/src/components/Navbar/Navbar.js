
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import InputGroup from 'react-bootstrap/InputGroup';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';


function AppNavbar({setToken}) {

    const handleLogout = () => {

        sessionStorage.removeItem('token')
        sessionStorage.removeItem('user')
        setToken(null)

    }

    return (
        <Navbar style={{marginBottom: "10px", borderRadius: "10px"}} expand="lg" className="bg-body-tertiary">
            <Container>
                <Navbar.Brand href="/">FantasyWaterLeague</Navbar.Brand>
                <Navbar.Collapse id="basic-navbar-nav">
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Nav className="me-auto">
                        <Nav.Link href="dashboard">Dashboard</Nav.Link>
                {/*        <Nav.Link href="#link">Link</Nav.Link>*/}
                {/*        <NavDropdown title="Dropdown" id="basic-nav-dropdown">*/}
                {/*            <NavDropdown.Item href="#action/3.1">Action</NavDropdown.Item>*/}
                {/*            <NavDropdown.Item href="#action/3.2">*/}
                {/*                Another action*/}
                {/*            </NavDropdown.Item>*/}
                {/*            <NavDropdown.Item href="#action/3.3">Something</NavDropdown.Item>*/}
                {/*            <NavDropdown.Divider />*/}
                {/*            <NavDropdown.Item href="#action/3.4">*/}
                {/*                Separated link*/}
                {/*            </NavDropdown.Item>*/}
                {/*        </NavDropdown>*/}
                    </Nav>
                </Navbar.Collapse>
            </Container>

            <Nav.Link href="admin">Admin</Nav.Link>
            <Form inline="true">
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
        </Navbar>
    );
}

export default AppNavbar;