import React, { Component } from "react";
import Card from 'react-bootstrap/Card';

const cardStyle = { 
    width: '300px', 
    margin: '20px' 
};

const cardTitleStyle = { 
    color: 'black' 
};

const cardTextStyle = { 
    color: 'black', 
    overflow: 'auto', 
    height: '100px' 
};

class IssueComponent extends Component<any, any> {
    constructor(props) {
        super(props);
        this.state = {
            data: this.props.data
        }
    }

    render() {
        const issue = this.state.data;
        return (
            <Card key={issue.html_url} style={cardStyle}>
                <Card.Body>
                    <Card.Title style={cardTitleStyle}>{issue.title}</Card.Title>
                    <Card.Subtitle className="mb-2 text-muted">Status: {issue.state}</Card.Subtitle>
                    <Card.Text style={cardTextStyle}>{issue.body}</Card.Text>
                    <Card.Link href={issue.html_url} target = "_blank">{issue.html_url}</Card.Link>
                </Card.Body>
            </Card>
        );
    }
};

export default IssueComponent;