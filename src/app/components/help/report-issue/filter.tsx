import React, {Component} from "react";
import Form from 'react-bootstrap/Form';

const formGroupStyle = {
    margin: '20px'
};

class FilterComponent extends Component<any, any> {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div>
                <Form.Group style={formGroupStyle}>
                    <Form.Control size="lg" type="text" placeholder="Search by keyword" value={this.props.filter} onChange={this.props.handleChange} />
                </Form.Group>
            </div>
        )
    }
}

export default FilterComponent;