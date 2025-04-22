export default eventHandler(async event => {
  const elements = await queryCollection(event, 'elements').all()
  console.log('elements', elements)

  return {
    elements
  }
});