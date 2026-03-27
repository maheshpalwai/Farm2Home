import Navbar from '../components/Navbar'

const AboutPage = () => {
  return (
    <div style={container}>
      <Navbar languageSelector={2} />
      <div style={content}>
        <h1 style={heading}>About Us</h1>
        <p style={text}>
          Farm2Home is a community-driven platform designed to bridge the gap between farmers and consumers.
          Our mission is to promote local agriculture, ensure fair prices, and bring farm-fresh produce directly to consumers.
        </p>

        <h2 style={subheading}>Our Project</h2>
        <p style={text}>
          Farm2Home was built to empower farmers and enable consumers to access healthy, farm-fresh food easily.
          The platform promotes direct interaction, transparency in pricing, and a sustainable food supply chain.
        </p>
      </div>
    </div>
  )
}

// ✅ Styles
const container = {
  paddingTop: '100px',
  backgroundColor: '#f4f4f4',
  minHeight: '100vh'
}

const content = {
  maxWidth: '800px',
  margin: 'auto',
  padding: '20px'
}

const heading = {
  textAlign: 'center',
  fontSize: '36px',
  marginBottom: '20px'
}

const subheading = {
  fontSize: '24px',
  marginTop: '30px',
  marginBottom: '10px'
}

const text = {
  fontSize: '18px',
  lineHeight: '1.6'
}

export default AboutPage
