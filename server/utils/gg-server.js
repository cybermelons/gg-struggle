
const ggServerPost = ({ headers, body, slug }) => {
    let url = `https://{host}/api/{slug}`;
  return { status: 200, headers: {}, body: 'nothing in body' }
}

export { ggServerPost }
