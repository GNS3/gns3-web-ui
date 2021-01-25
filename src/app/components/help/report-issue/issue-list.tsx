import React, { Component } from "react";
import { FunctionComponent, useEffect, useRef, useState } from 'react';
import Card from 'react-bootstrap/Card';

const apiUrl = 'https://api.github.com/repos/GNS3/gns3-web-ui/issues';

class IssueListComponent extends Component<any, any> {
    constructor(props) {
        super(props);
        this.state = {
            isFetching: false,
            issues: []
        };
    }

    componentDidMount() {
        fetch(apiUrl)
            .then(response => response.json())
            .then(data => this.setState({ issues: data }));
    }

    render() {
        const { issues } = this.state;
     
        return (
          <div>
            {issues.map(issue =>
                <Card key={issue.title} style={{ width: '18rem' }}>
                    <Card.Body>
                        <Card.Title>{issue.title}</Card.Title>
                        <Card.Subtitle className="mb-2 text-muted">Status: {issue.state}</Card.Subtitle>
                        <Card.Text>
                            Description: {issue.body}
                        </Card.Text>
                        <Card.Link href="#">{issue.html_url}</Card.Link>
                    </Card.Body>
                </Card>
            )}
          </div>
        );
    }
};

export default IssueListComponent;